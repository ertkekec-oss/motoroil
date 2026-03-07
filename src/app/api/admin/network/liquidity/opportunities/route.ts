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
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get('limit') || '50';
        const limit = parseInt(limitParam);

        const typeParam = searchParams.get('type');

        const filter: any = {};
        if (typeParam) filter.opportunityType = typeParam;

        const opportunities = await prisma.networkLiquidityOpportunity.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({ success: true, count: opportunities.length, opportunities });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch network opportunities' }, { status: 500 });
    }
}
