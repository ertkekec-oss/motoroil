import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { tenantId, role } = await getRequestContext(req);

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const proposals = await prisma.networkTradeProposal.findMany({
            where: {
                OR: [
                    { buyerTenantId: tenantId },
                    { sellerTenantId: tenantId }
                ]
            },
            include: {
                messages: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ success: true, count: proposals.length, proposals });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch proposals' }, { status: 500 });
    }
}
