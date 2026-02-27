import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { enqueueReleasePayout } from "@/services/finance/payout/iyzico/releasePayout";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { shipmentId: string } }) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        // Assuming body contains amounts (gross, commission, net, seller) since it's a manual trigger
        // In real FIN-1 integration, we'd fetch these from SellerEarning
        const payout = await enqueueReleasePayout({
            shipmentId: params.shipmentId,
            sellerTenantId: body.sellerTenantId,
            grossAmount: Number(body.grossAmount),
            commissionAmount: Number(body.commissionAmount),
            netAmount: Number(body.netAmount)
        });

        // Audit Admin manual trigger
        await prisma.financeAuditLog.create({
            data: {
                tenantId: body.sellerTenantId,
                actor: 'PLATFORM_ADMIN',
                action: 'PAYOUT_ENQUEUED' as any,
                entityId: payout.id,
                entityType: 'ProviderPayout',
                payloadJson: { note: 'Manual Admin Trigger', shipmentId: params.shipmentId, userId: session.userId || session.id }
            }
        });

        return NextResponse.json(payout);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
