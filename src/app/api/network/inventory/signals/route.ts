import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NetworkInventorySignalType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type') as NetworkInventorySignalType | undefined;

        const whereClause: any = { tenantId };
        if (typeFilter) {
            whereClause.signalType = typeFilter;
        }

        const signals = await prisma.networkInventorySignal.findMany({
            where: whereClause,
            orderBy: { confidenceScore: 'desc' },
            take: 50
        });

        return NextResponse.json({ success: true, signals });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
