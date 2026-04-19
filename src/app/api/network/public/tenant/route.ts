import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
    const headersList = await headers();
    let slug = headersList.get('x-b2b-tenant-slug');

    if (!slug) {
        const host = headersList.get('host') || "";
        const hostname = host.split(':')[0]; // Portu temizle
        const isPrimaryDomain = 
            hostname === 'periodya.com' || 
            hostname === 'www.periodya.com' ||
            hostname === 'localhost' ||
            hostname.includes('vercel.app');
        const isB2BGlobal = hostname === 'b2b.periodya.com' || hostname === 'b2b.localhost';

        if (!isPrimaryDomain && !isB2BGlobal) {
            if (hostname.endsWith('.periodya.com')) {
                slug = hostname.replace('.periodya.com', '');
            } else if (hostname.endsWith('.localhost')) {
                slug = hostname.replace('.localhost', '');
            }
            // Özel alan adları için de ileride b2bCustomDomain üzerinden sorgu atılabilir. Şimdilik bu kısmı bıraktım.
        }
    }

    // Eğer halen bulunamadıysa (ilgili domainin özel alan adı olup olmadığını da kontrol edelim):
    if (!slug) {
        const host = headersList.get('host') || "";
        const hostname = host.split(':')[0]; // Portsuz

        const tenantByDomain = await prisma.tenant.findUnique({
            where: { b2bCustomDomain: hostname }
        });
        if (tenantByDomain) slug = tenantByDomain.tenantSlug;
    }

    if (!slug) {
        return NextResponse.json({ tenantId: null, slug: null });
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { tenantSlug: slug },
            select: { id: true, name: true }
        });

        if (tenant) {
            const config = await prisma.tenantPortalConfig.findUnique({
                where: { tenantId: tenant.id },
                select: { primaryColor: true, logoUrl: true }
            });
            return NextResponse.json({ 
                tenantId: tenant.id, 
                slug, 
                name: tenant.name,
                primaryColor: config?.primaryColor || '#2563EB',
                logoUrl: config?.logoUrl || null
            });
        }
        
        return NextResponse.json({ tenantId: null, slug: null });
    } catch (err) {
        return NextResponse.json({ tenantId: null, slug: null }, { status: 500 });
    }
}
