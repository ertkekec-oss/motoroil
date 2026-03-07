import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: any) {
    const { role } = await getRequestContext(req);

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const url = new URL(req.url);
        const buyerTenantId = url.searchParams.get('buyerTenantId');

        let whereClause: any = { status: 'ACTIVE', contextType: 'TENANT' };
        if (buyerTenantId) whereClause.buyerTenantId = buyerTenantId;

        const risks = await prisma.networkTradeRiskScore.findMany({
            where: whereClause,
            orderBy: { overallRiskScore: 'desc' },
            take: 100
        });

        return NextResponse.json({ data: risks });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
