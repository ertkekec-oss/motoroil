import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!from || !to) {
             return NextResponse.json({ error: 'Missing from or to parameters' }, { status: 400 });
        }

        const metrics = await prisma.tenantDailyMetrics.findMany({
            where: {
                 tenantId: session.tenantId,
                 day: { gte: from, lte: to }
            },
            orderBy: { day: 'asc' }
        });

        return NextResponse.json(metrics);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
