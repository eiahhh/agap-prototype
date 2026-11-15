import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";

const font_poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font_poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGAP | Sign In",
  description: "AGAP, the Alert & Guidance Portal of CDRRMO Dasmariñas City.",
};

export default function root_layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={font_poppins.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
