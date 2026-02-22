import "./globals.css";
import { Providers } from "@/components/Providers";
import CookieConsent from "@/components/CookieConsent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Periodya Enterprise",
  description: "Kurumsal Kaynak Yönetimi",
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
