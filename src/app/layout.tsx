import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import SnapPixel from "@/components/SnapPixel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vega Power | رياضتك أسهل بين يدك",
  description: "علامة لياقة بسيطة وواضحة — برامج جاهزة للتحميل وتطبيق مع مجتمع ودعم.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={inter.variable}>
      <body className="antialiased">
        <MetaPixel />
        <SnapPixel />
        {children}
      </body>
    </html>
  );
}
