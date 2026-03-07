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
        const tenantId = url.searchParams.get('tenantId');

        let whereClause: any = { status: 'ACTIVE' };
        if (tenantId) whereClause.tenantId = tenantId;

        const scores = await prisma.networkReputationScore.findMany({
            where: whereClause,
            orderBy: { overallScore: 'asc' },
            take: 100
        });

        return NextResponse.json({ data: scores });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
