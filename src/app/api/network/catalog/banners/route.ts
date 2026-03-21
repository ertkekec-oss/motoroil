export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireDealerSession } from "@/lib/network/session";
import { readActiveMembershipId } from "@/lib/network/cookies";
import { prismaRaw as prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await requireDealerSession().catch(() => null);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const membershipId = await readActiveMembershipId();
        if (!membershipId) return NextResponse.json({ error: 'No membership selected' }, { status: 400 });

        const membership = await prisma.dealerMembership.findUnique({
            where: { id: membershipId },
            select: { tenantId: true }
        });

        if (!membership) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });

        const banners = await prisma.networkBanner.findMany({
            where: { tenantId: membership.tenantId, isActive: true },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json({ ok: true, banners });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
