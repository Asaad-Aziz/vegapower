import type { Metadata } from "next";
import { Tajawal, Instrument_Serif } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";

const tajawal = Tajawal({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
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
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className={`${tajawal.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
