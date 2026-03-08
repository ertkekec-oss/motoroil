import "./globals.css";
import { Providers } from "@/components/Providers";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "sonner";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var localTheme = localStorage.getItem('periodya-theme') || localStorage.getItem('motoroil-theme');
                var themeToSet = localTheme || 'dark';
                document.documentElement.setAttribute('data-theme', themeToSet);
                if (themeToSet === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
        <CookieConsent />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
