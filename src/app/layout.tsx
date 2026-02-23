import "./globals.css";
import { Providers } from "@/components/Providers";
import CookieConsent from "@/components/CookieConsent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Periodya Enterprise",
    template: "%s | Periodya"
  },
  description: "Kurumsal Kaynak Yönetimi ve ERP Çözümleri",
  metadataBase: new URL('https://www.periodya.com'),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://www.periodya.com',
    siteName: 'Periodya',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
