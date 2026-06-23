import Link from "next/link";
import ClearCart from "./ClearCart";

export const metadata = { title: "Order confirmed — Cole Hocker" };

export default function SuccessPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-[100px]">
      <ClearCart />
      <div className="max-w-[480px] text-center">
        <div className="mb-4 font-body text-xs uppercase tracking-[0.32em] font-bold text-ch-gold">
          Order Confirmed
        </div>
        <h1 className="font-display text-[clamp(40px,5vw,64px)] uppercase leading-[0.95] tracking-[-0.005em]">
          Thank You
        </h1>
        <p className="mt-6 font-narrow text-sm uppercase tracking-[0.12em] text-ch-muted">
          Your order is in. A confirmation is on its way to your email, and we&apos;ll
          notify you when it ships.
        </p>
        <Link
          href="/shop"
          className="mt-10 inline-block font-body text-[13px] font-extrabold uppercase tracking-[0.16em] text-white no-underline border-b border-ch-gold pb-1"
        >
          Keep shopping
        </Link>
      </div>
    </main>
  );
}
