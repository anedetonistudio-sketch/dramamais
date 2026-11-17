import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PwaRegister from "@/components/PwaRegister";
import DemoBanner from "@/components/DemoBanner";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Drama+ | Microdramas 100% brasileiros por R$ 25/mês", template: "%s | Drama+" },
  description: SITE.description,
  applicationName: "Drama+",
  keywords: ["microdrama", "drama vertical", "novela curta", "série curta", "drama brasileiro", "streaming brasileiro", "Drama+"],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Drama+", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Drama+",
    url: SITE.url,
    title: "Drama+ | Microdramas 100% brasileiros por R$ 25/mês",
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: "Drama+ | Microdramas 100% brasileiros", description: SITE.description },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">
        <DemoBanner />
        <Header />
        <main>{children}</main>
        <Footer />
        <PwaRegister />
      </body>
    </html>
  );
}
