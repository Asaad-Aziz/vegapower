import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";

const tajawal = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
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
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.variable} antialiased`}>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
