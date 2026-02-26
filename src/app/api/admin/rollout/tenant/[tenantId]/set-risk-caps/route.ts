import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const body = await req.json().catch(() => ({}));

        const policy = await prisma.tenantRolloutPolicy.upsert({
             where: { tenantId: params.tenantId },
             update: {
                 maxDailyGmv: body.maxDailyGmv,
                 maxDailyPayout: body.maxDailyPayout,
                 maxSingleOrderAmount: body.maxSingleOrderAmount,
                 holdDaysOverride: body.holdDaysOverride,
                 earlyReleaseAllowed: body.earlyReleaseAllowed
             },
             create: {
                 tenantId: params.tenantId,
                 maxDailyGmv: body.maxDailyGmv,
                 maxDailyPayout: body.maxDailyPayout,
                 maxSingleOrderAmount: body.maxSingleOrderAmount,
                 holdDaysOverride: body.holdDaysOverride,
                 earlyReleaseAllowed: body.earlyReleaseAllowed
             }
        });

        await prisma.financeOpsLog.create({
            data: {
                 action: 'TENANT_RISK_CAPS_UPDATED',
                 entityType: 'Tenant',
                 entityId: params.tenantId,
                 severity: 'INFO',
                 payloadJson: { adminUserId: session.id, riskCaps: body }
            }
        });

        return NextResponse.json({ success: true, policy });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
