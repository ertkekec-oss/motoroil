import QCommerceMenuWorkspace from '@/components/qcommerce/QCommerceMenuWorkspace';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Dijital Menü & Sipariş',
    description: 'Periodya Q-Commerce Online Menü Altyapısı',
};

export default async function TenantMenuPage({ params }: { params: { slug: string } }) {
    // 1. Resolve Tenant
    const tenant = await prisma.tenant.findUnique({
        where: { tenantSlug: params.slug },
        select: { id: true, name: true, companies: { select: { id: true } } }
    });

    if (!tenant) notFound();

    // 2. We find the primary company to act as the stock owner. 
    // Usually the first company, or we can query products by companyId if needed.
    // For now we just query all products belonging to any company of this tenant
    const companyIds = tenant.companies.map(c => c.id);

    // 3. Fetch Products configured for POS / Q-Menu
    // We will use isPosItem if they set it, otherwise we'll just show active products.
    // We can also fetch categories dynamically based on the posCategory field.
    const products = await prisma.product.findMany({
        where: {
            companyId: { in: companyIds },
            status: "Aktif",
            deletedAt: null
        },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            category: true,
            posCategory: true,
            isPosItem: true
        }
    });

    // 4. Map the models perfectly for QCommerce workspace
    // Fallback categories if they don't have posCategory defined
    const mappedProducts = products.map(p => ({
        id: p.id,
        categoryId: p.posCategory || p.category || 'Tümü', 
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        image: p.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
        popular: false
    }));

    return (
        <div className="w-full min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1220]">
            <QCommerceMenuWorkspace 
                tenantSlug={params.slug} 
                tenantName={tenant.name}
                menuItems={mappedProducts}
            />
        </div>
    );
}
