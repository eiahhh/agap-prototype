import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import "./globals.css";

const font_outfit = Outfit({
  subsets: ["latin"],
  variable: "--font_outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGAP | Sign In",
  description: "AGAP, the Alert & Guidance Portal of CDRRMO Dasmariñas City.",
};

export default function root_layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={font_outfit.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
