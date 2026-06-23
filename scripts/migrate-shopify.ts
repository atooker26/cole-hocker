/**
 * Idempotent Shopify → Supabase migration.
 *
 * Usage:
 *   1. Export "Products" CSV from Shopify admin → scripts/data/products_export.csv
 *      (Optional later: orders_export.csv, customers_export.csv)
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   3. npm run migrate:shopify
 *
 * Re-runs are safe: products upsert on shopify_product_id, variants on
 * shopify_variant_id. Images keep their Shopify CDN URLs (already public); move
 * them into Supabase Storage later if desired.
 *
 * The Shopify products CSV has one row per variant; rows for the same product
 * share a Handle, and only the first row carries Title/Body/Image.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ws from "ws";
import { createClient } from "@supabase/supabase-js";

// supabase-js eagerly constructs a realtime client; Node < 22 has no global
// WebSocket, so polyfill it for this standalone script (the Next.js runtime
// already provides one).
(globalThis as { WebSocket?: unknown }).WebSocket ??= ws;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const CSV_PATH = resolve(process.cwd(), "scripts/data/products_export.csv");

/** Minimal RFC-4180 CSV parser (handles quoted fields, commas, newlines). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows.map((r) =>
    Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])),
  );
}

function dollarsToCents(v: string): number {
  const n = parseFloat(v || "0");
  return Math.round((isNaN(n) ? 0 : n) * 100);
}

async function main() {
  const text = readFileSync(CSV_PATH, "utf8");
  const records = parseCsv(text);

  // Group rows by Handle.
  const byHandle = new Map<string, Record<string, string>[]>();
  for (const rec of records) {
    const handle = rec["Handle"];
    if (!handle) continue;
    if (!byHandle.has(handle)) byHandle.set(handle, []);
    byHandle.get(handle)!.push(rec);
  }

  let products = 0;
  let variants = 0;

  for (const [handle, rowsForHandle] of byHandle) {
    const head = rowsForHandle[0];
    const images = rowsForHandle
      .map((r) => r["Image Src"])
      .filter((s, i, arr) => s && arr.indexOf(s) === i);

    const status = (head["Status"] || "active").toLowerCase();
    const { data: product, error: pErr } = await supabase
      .from("products")
      .upsert(
        {
          handle,
          title: head["Title"] || handle,
          description: head["Body (HTML)"] || null,
          status: ["active", "draft", "archived"].includes(status)
            ? status
            : "active",
          images,
          shopify_product_id: head["Handle"], // Shopify CSV lacks numeric id; handle is stable
        },
        { onConflict: "shopify_product_id" },
      )
      .select("id")
      .single();
    if (pErr) {
      console.error(`Product ${handle} failed:`, pErr.message);
      continue;
    }
    products++;

    let position = 0;
    for (const r of rowsForHandle) {
      // Variant rows have an option value or a price.
      const variantTitle =
        [r["Option1 Value"], r["Option2 Value"], r["Option3 Value"]]
          .filter(Boolean)
          .join(" / ") || "Default";
      const price = r["Variant Price"];
      if (!price && variantTitle === "Default" && position > 0) continue;

      const sku = r["Variant SKU"] || null;
      const shopifyVariantId =
        r["Variant SKU"] || `${handle}:${variantTitle}`;

      const { data: variant, error: vErr } = await supabase
        .from("variants")
        .upsert(
          {
            product_id: product.id,
            title: variantTitle,
            sku,
            price_cents: dollarsToCents(price),
            position: position++,
            shopify_variant_id: shopifyVariantId,
          },
          { onConflict: "shopify_variant_id" },
        )
        .select("id")
        .single();
      if (vErr) {
        console.error(`Variant ${handle}/${variantTitle} failed:`, vErr.message);
        continue;
      }
      variants++;

      const qty = parseInt(r["Variant Inventory Qty"] || "0", 10);
      await supabase.from("inventory").upsert(
        {
          variant_id: variant.id,
          quantity: isNaN(qty) ? 0 : qty,
          track: (r["Variant Inventory Tracker"] || "shopify") !== "",
        },
        { onConflict: "variant_id" },
      );
    }
  }

  console.log(`✓ Migrated ${products} products, ${variants} variants.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
