import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { runDailyMetricsJob } from "@/services/metrics/dailyMetrics";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const body = await req.json().catch(() => ({}));
        
        const dayStr = body.dayStr;
        const backfillDays = body.backfillDays ? Number(body.backfillDays) : undefined;

        const result = await runDailyMetricsJob({ dayStr, backfillDays });

        await prisma.financeOpsLog.create({
            data: {
                action: 'METRICS_RUN',
                entityType: 'System',
                severity: 'INFO',
                payloadJson: { adminUserId: session.id, dayStr, backfillDays, result }
            }
        });

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 403 });
    }
}
