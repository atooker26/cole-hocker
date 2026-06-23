import InventoryTable, {
  type InventoryRow,
} from "@/components/admin/InventoryTable";
import { getAllProducts } from "@/lib/db/queries";

export const metadata = { title: "Inventory — Shop Admin" };

export default async function InventoryPage() {
  const products = await getAllProducts();
  const rows: InventoryRow[] = products.flatMap((p) =>
    p.variants.map((v) => ({
      variantId: v.id,
      product: p.title,
      variant: v.title,
      quantity: v.inventory?.quantity ?? 0,
      track: v.inventory?.track ?? true,
    })),
  );

  return (
    <div>
      <h1 className="mb-8 font-display text-4xl uppercase tracking-[-0.01em]">Inventory</h1>
      {rows.length === 0 ? (
        <p className="font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          No variants yet.
        </p>
      ) : (
        <InventoryTable rows={rows} />
      )}
    </div>
  );
}
