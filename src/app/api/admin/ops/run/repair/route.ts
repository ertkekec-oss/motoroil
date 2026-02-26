import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { runStuckPayoutRepair } from "@/services/finance/payout/repair";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const res = await runStuckPayoutRepair();
        
        await prisma.financeOpsLog.create({
            data: {
                action: 'OPS_RUN_REPAIR',
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
