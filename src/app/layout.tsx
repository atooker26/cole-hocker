import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { TEGO_QUEUE_STUB } from "@/lib/tego-stub";

const title = "Cole Hocker — Olympic Champion, 1500 m Gold Medalist, Nike Athlete";
const description =
  "Official website of Cole Hocker — Olympic Gold Medalist (1500 m, Paris 2024), World Champion (5000 m, Tokyo 2025), Nike athlete.";

export const metadata: Metadata = {
  metadataBase: new URL("https://colehocker.com"),
  title,
  description,
  openGraph: {
    type: "website",
    url: "https://colehocker.com",
    siteName: "Cole Hocker",
    title,
    description,
    images: [
      {
        url: "/assets/worlds-thumb.png",
        width: 1050,
        height: 540,
        alt: "Cole Hocker — 2025 5000 m World Champion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/worlds-thumb.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/* Must precede tego.js and hydration — see src/lib/tego-stub.ts. */}
        <script dangerouslySetInnerHTML={{ __html: TEGO_QUEUE_STUB }} />
        <script defer src="https://www.tegomarketing.com/tego.js" data-slug="cole-hocker" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
