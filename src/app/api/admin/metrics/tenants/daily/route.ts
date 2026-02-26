import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requirePlatformFinanceAdmin } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin();
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const tenantId = searchParams.get('tenantId');

        if (!from || !to || !tenantId) {
             return NextResponse.json({ error: 'Missing from, to or tenantId parameters' }, { status: 400 });
        }

        const metrics = await prisma.tenantDailyMetrics.findMany({
            where: {
                 tenantId,
                 day: { gte: from, lte: to }
            },
            orderBy: { day: 'asc' }
        });

        return NextResponse.json(metrics);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 403 });
    }
}
