import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { processPayoutOutbox } from "@/services/finance/payout/iyzico/outboxWorker";
import { OPS_SCHEDULES } from "@/services/ops/schedules";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const res = await processPayoutOutbox(OPS_SCHEDULES.payoutOutbox.batchSize);
        
        await prisma.financeOpsLog.create({
            data: {
                action: 'OPS_RUN_OUTBOX',
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
