import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
    const headersList = await headers();
    const slug = headersList.get('x-b2b-tenant-slug');

    if (!slug) {
        return NextResponse.json({ tenantId: null, slug: null });
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { tenantSlug: slug },
            select: { id: true, name: true }
        });

        if (tenant) {
            return NextResponse.json({ tenantId: tenant.id, slug, name: tenant.name });
        }
        
        return NextResponse.json({ tenantId: null, slug: null });
    } catch (err) {
        return NextResponse.json({ tenantId: null, slug: null }, { status: 500 });
    }
}
