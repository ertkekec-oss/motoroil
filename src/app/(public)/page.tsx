import ModernLanding from '@/components/landing/ModernLanding';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
    title: "Periodya Enterprise | Türkiye'nin En Kapsamlı ERP Yazılımı",
    description: "Periodya ile işletmenizi uçtan uca yönetin. POS, stok yönetimi, saha satış, PDKS ve finansal kontrol kulesi ile verimliliğinizi artırın. Yerli ve güçlü ERP çözümü.",
    alternates: {
        canonical: "https://www.periodya.com/",
    },
    openGraph: {
        title: "periodya.com | Enterprise ERP",
        description: "Finans, Stok, Satış ve Saha Operasyonları tek bir platformda.",
        url: "https://www.periodya.com/",
        siteName: "Periodya",
        locale: "tr_TR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
    },
    robots: {
        index: true,
        follow: true,
    }
};

export const revalidate = 60; // 1 minute ISR

export default async function Page() {
    // Fetch CMS settings if available
    let cmsData = null;
    try {
        const page = await (prisma as any).cmsPage.findUnique({
            where: { slug: 'index' },
            include: { sections: { orderBy: { order: 'asc' } } }
        });
        if (page?.isActive) {
            cmsData = page;
        }
    } catch (e) {
        console.error("Failed to load CMS data", e);
    }

    return <ModernLanding cmsData={cmsData} />;
}
