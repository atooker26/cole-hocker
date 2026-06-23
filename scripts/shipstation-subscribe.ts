/**
 * Register the SHIP_NOTIFY webhook with ShipStation so shipment tracking flows
 * back to the shop. Run once after setting the ShipStation env vars.
 *
 *   npm run shipstation:subscribe
 *
 * Needs: SHIPSTATION_API_KEY, SHIPSTATION_API_SECRET, NEXT_PUBLIC_SITE_URL,
 * SHIPSTATION_WEBHOOK_TOKEN (the production site URL must be publicly reachable).
 */
export {}; // treat as a module so script-scoped consts don't collide

const key = process.env.SHIPSTATION_API_KEY;
const secret = process.env.SHIPSTATION_API_SECRET;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const token = process.env.SHIPSTATION_WEBHOOK_TOKEN;

if (!key || !secret || !siteUrl || !token) {
  console.error(
    "Missing one of SHIPSTATION_API_KEY, SHIPSTATION_API_SECRET, NEXT_PUBLIC_SITE_URL, SHIPSTATION_WEBHOOK_TOKEN",
  );
  process.exit(1);
}

async function main() {
  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
  const target_url = `${siteUrl}/api/webhooks/shipstation?token=${encodeURIComponent(token!)}`;
  const res = await fetch("https://ssapi.shipstation.com/webhooks/subscribe", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      target_url,
      event: "SHIP_NOTIFY",
      friendly_name: "Cole Hocker shop — ship notify",
      store_id: null,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Subscribe failed (${res.status}): ${text}`);
    process.exit(1);
  }
  console.log("✓ Subscribed SHIP_NOTIFY →", target_url);
  console.log(text);
}

main();
