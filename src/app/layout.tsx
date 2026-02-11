import type { Metadata } from "next";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";

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
      <body className="antialiased">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
