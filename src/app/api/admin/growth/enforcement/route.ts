import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isGrowthAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_GROWTH_ADMIN' || role === 'PLATFORM_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        const where: any = {};
        if (tenantId) where.tenantId = tenantId;

        const enforcements = await prisma.boostTenantEnforcement.findMany({
            where,
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ items: enforcements });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
