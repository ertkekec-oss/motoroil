import HomeClient from './HomeClient';
import SeoContent from '@/components/SeoContent';
import SeoSchema from '@/components/SeoSchema';
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

/**
 * Server Component Wrapper for the Main Page
 * 
 * Bu yapı, istemci bileşenini (HomeClient) sarmalayarak HTML kaynağına 
 * SEO içeriği (SeoContent) ve JSON-LD şemalarını (SeoSchema) SSR olarak basar.
 */
import { redirect } from 'next/navigation';

export default function Page() {
    redirect('/dashboard');
    return null;
}
