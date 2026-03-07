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
        const limit = parseInt(searchParams.get('limit') || '50');

        const proposals = await prisma.networkTradeProposal.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({ success: true, count: proposals.length, proposals });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch admin network proposals' }, { status: 500 });
    }
}
