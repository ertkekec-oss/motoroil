import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [subscription, rollout, usage] = await Promise.all([
            prisma.boostSubscription.findFirst({
                where: { sellerTenantId: auth.user.companyId },
                include: { plan: true },
                orderBy: { createdAt: "desc" }
            }),
            prisma.tenantRolloutPolicy.findUnique({
                where: { tenantId: auth.user.companyId }
            }),
            // fetch current period usage roughly
            prisma.boostUsageDaily.aggregate({
                where: { sellerTenantId: auth.user.companyId },
                _sum: { billableImpressions: true }
            })
        ]);

        if (!subscription) {
            return NextResponse.json({ error: "No active boost subscription" }, { status: 404 });
        }

        const quotaTotal = subscription.plan?.monthlyImpressionQuota || 0;
        const quotaUsed = usage._sum.billableImpressions || 0;
        const quotaRemaining = Math.max(0, quotaTotal - quotaUsed);

        return NextResponse.json({
            subscription: {
                id: subscription.id,
                planName: subscription.plan?.name,
                price: subscription.plan?.monthlyPrice,
                status: subscription.status,
                billingBlocked: subscription.billingBlocked,
                period: subscription.lastChargedPeriodKey,
                quotaTotal: quotaTotal,
                quotaUsed: quotaUsed,
                quotaRemaining: quotaRemaining,
                renewsAt: subscription.nextRenewalAt
            },
            rollout: {
                boostPaused: rollout?.boostPaused || false
            }
        });
    } catch (e: any) {
        console.error("Boost Status API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
