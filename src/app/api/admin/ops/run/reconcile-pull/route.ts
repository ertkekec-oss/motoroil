import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { runProviderPayoutReconcileCycle } from "@/services/finance/payout/iyzico/reconcilePull";
import { OPS_SCHEDULES } from "@/services/ops/schedules";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const res = await runProviderPayoutReconcileCycle({ batchSize: OPS_SCHEDULES.reconcilePull.batchSize });
        
        await prisma.financeOpsLog.create({
            data: {
                action: 'OPS_RUN_RECONCILE',
                entityType: 'System',
                severity: 'INFO',
                payloadJson: { adminUserId: session.id, result: res }
            }
        });

        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
