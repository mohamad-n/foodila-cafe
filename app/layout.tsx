import type { Metadata } from "next";
import { iranYekan, poppins } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "منوی کافه",
  description: "QR-code café menus — immersive, photo-forward, Persian (RTL).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes (admin-only) sets `data-theme` on <html> from
    // localStorage on the client, which the server can't know — this silences that one diff.
    <html
      lang="fa"
      dir="rtl"
      className={`${poppins.variable} ${iranYekan.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
