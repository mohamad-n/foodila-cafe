import type { Viewport } from "next";
import "@/components/menu/menu.css";

// Immersive, full-bleed menu. Zoom stays enabled (accessibility); cover the notch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E0C0B",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
