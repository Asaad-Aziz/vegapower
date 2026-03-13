import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import SnapPixel from "@/components/SnapPixel";
import TikTokPixel from "@/components/TikTokPixel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vegapower.store"),
  title: "Vega Power | رياضتك أسهل بين يدك",
  description: "علامة لياقة بسيطة وواضحة — برامج جاهزة للتحميل وتطبيق مع مجتمع ودعم.",
  keywords: [
    "فيقا باور",
    "Vega Power",
    "برامج تمارين",
    "برنامج تغذية",
    "لياقة",
    "تمارين منزلية",
    "خسارة وزن",
    "بناء عضلات",
    "تطبيق رياضة",
  ],
  openGraph: {
    siteName: "Vega Power",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
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
        <TikTokPixel />
        {children}
      </body>
    </html>
  );
}
