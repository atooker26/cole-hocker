import { CartProvider } from "@/components/shop/CartProvider";
import ShopHeader from "@/components/shop/ShopHeader";
import Footer from "@/components/Footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-black text-white">
        <ShopHeader />
        {children}
        <Footer />
      </div>
    </CartProvider>
  );
}
