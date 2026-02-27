import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = auth.user.companyId;
    const tenantId = auth.user.tenantId;

    try {
        const [ledger, rollout] = await Promise.all([
            prisma.ledgerAccount.findUnique({
                where: { companyId }
            }),
            prisma.tenantRolloutPolicy.findUnique({
                where: { tenantId }
            })
        ]);

        return NextResponse.json({
            balances: {
                availableBalance: ledger?.availableBalance || 0,
                reservedBalance: ledger?.reservedBalance || 0,
                pendingBalance: ledger?.pendingBalance || 0,
                currency: ledger?.currency || "TRY"
            },
            payoutPaused: rollout?.payoutPaused || false,
            boostPaused: rollout?.boostPaused || false,
            escrowPaused: rollout?.escrowPaused || false
        });
    } catch (e: any) {
        console.error("Payout Summary API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
