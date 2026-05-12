import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cole Hocker — Olympic Champion, 1500 m Gold Medalist, Nike Athlete",
  description:
    "Official website of Cole Hocker — Olympic Gold Medalist (1500 m, Paris 2024), World Champion (5000 m, Tokyo 2025), Nike athlete.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
