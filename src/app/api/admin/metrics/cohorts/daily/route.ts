import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requirePlatformFinanceAdmin } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin();
        const { searchParams } = new URL(req.url);
        const tag = searchParams.get('tag'); // Optional: filter by specific cohort
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!from || !to) {
             return NextResponse.json({ error: 'Missing from or to parameters' }, { status: 400 });
        }

        const metrics = await prisma.platformCohortDailyMetrics.findMany({
            where: {
                 ...(tag ? { cohortTag: tag } : {}),
                 day: { gte: from, lte: to }
            },
            orderBy: { day: 'asc' }
        });

        return NextResponse.json(metrics);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 403 });
    }
}
