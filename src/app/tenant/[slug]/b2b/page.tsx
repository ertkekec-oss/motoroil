import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function TenantB2BPage({ params }: { params: { slug: string } }) {
    // We check if this tenant slug is valid.
    const tenant = await prisma.tenant.findUnique({
        where: { tenantSlug: params.slug },
        select: { id: true }
    });

    if (!tenant) {
        // Tenant not found
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-mono p-8 text-center">
                <div>
                    <h1 className="text-4xl font-black text-rose-500 mb-2">404 - Şirket Bulunamadı</h1>
                    <p className="text-slate-400">"{params.slug}" uzantılı bir kurumsal bayi ağı bulunmuyor.</p>
                </div>
            </div>
        );
    }

    // Redirect to the global B2B portal login page, passing the specific tenant parameter
    // The B2B portal at b2b.periodya.com is capable of handling the supplier automatically via this parameter
    redirect(`https://b2b.periodya.com/login?supplier=${tenant.id}`);
}
