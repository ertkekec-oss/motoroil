import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { runFinanceIntegrityCheck } from "@/services/finance/integrity/sentinel";
import { escalateAlertsIfNeeded } from "@/services/ops/alerts";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const res = await runFinanceIntegrityCheck();
        const escRes = await escalateAlertsIfNeeded();
        
        await prisma.financeOpsLog.create({
            data: {
                action: 'OPS_RUN_SENTINEL',
                entityType: 'System',
                severity: 'INFO',
                payloadJson: { adminUserId: session.id, sentinelResult: res, escalationResult: escRes }
            }
        });

        return NextResponse.json({ sentinel: res, escalation: escRes });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
