import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/db/queries";

export const metadata = { title: "Edit product — Shop Admin" };

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]">,
) {
  const { id } = await props.params;
  const product = await getProductById(id);
  if (!product) notFound();
  return <ProductForm product={product} />;
}
