import QCommerceMenuWorkspace from '@/components/qcommerce/QCommerceMenuWorkspace';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dijital Menü & Sipariş',
    description: 'Periodya Q-Commerce Online Menü Altyapısı',
};

export default function TenantMenuPage({ params }: { params: { slug: string } }) {
    return (
        <div className="w-full min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1220]">
            <QCommerceMenuWorkspace tenantSlug={params.slug} />
        </div>
    );
}
