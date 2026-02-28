import LandingPage from '@/components/LandingPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Periodya Enterprise | Türkiye'nin En Kapsamlı ERP Yazılımı",
    description: "Periodya ile işletmenizi uçtan uca yönetin. POS, stok yönetimi, saha satış, PDKS ve finansal kontrol kulesi ile verimliliğinizi artırın. Yerli ve güçlü ERP çözümü.",
    alternates: {
        canonical: "https://www.periodya.com/",
    },
    openGraph: {
        title: "Periodya Enterprise ERP - İşletmenizi Geleceğe Taşıyın",
        description: "Finans, Stok, Satış ve Saha Operasyonları tek bir platformda. Periodya ile kurumsal kaynaklarınızı akıllıca yönetin.",
        url: "https://www.periodya.com/",
        siteName: "Periodya",
        locale: "tr_TR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Periodya Enterprise ERP",
        description: "İşletme yönetimi için modern ve güçlü ERP çözümü.",
    },
    robots: {
        index: true,
        follow: true,
    }
};

export default function Page() {
    // Render the Landing Page directly for the root '/' route
    return <LandingPage />;
}
