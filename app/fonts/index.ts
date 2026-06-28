/**
 * Self-hosted fonts (next/font/local — zero layout shift, no external requests).
 *
 * Stack intent: Persian-primary. The Tailwind `font-sans` stack lists IRANYekan first (it carries
 * the Persian glyphs); Poppins follows to cover Latin. See tailwind.config.ts `fontFamily.sans`.
 *
 * The .ttf files live alongside this module (app/fonts/*.ttf).
 */
import localFont from "next/font/local";

export const iranYekan = localFont({
  src: [
    { path: "./iranyekanweblight.ttf", weight: "300", style: "normal" },
    { path: "./iranyekanwebregular.ttf", weight: "400", style: "normal" },
    { path: "./iranyekanwebmedium.ttf", weight: "500", style: "normal" },
    { path: "./iranyekanwebbold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-iranyekan",
  display: "swap",
  // Persian glyph metrics; Tahoma is the closest widely-available fallback.
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});

export const poppins = localFont({
  src: [
    { path: "./Poppins-Light.ttf", weight: "300", style: "normal" },
    { path: "./Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "./Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "./Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
