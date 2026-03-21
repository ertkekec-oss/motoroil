import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

function toNumber(v: any) {
    if (v == null) return 0
    if (typeof v === "number") return v
    if (typeof v === "string") return Number(v)
    if (typeof v === "object" && "toNumber" in v && typeof v.toNumber === "function") return v.toNumber()
    return Number(v)
}

const CREDIT_EXPOSURE_STATUSES = ["PENDING_APPROVAL", "APPROVED", "PAID_PENDING_APPROVAL"] as const

export async function GET() {
    try {
        const ctx = await requireDealerContext()

        const membership = await prisma.dealerMembership.findFirst({
            where: {
                id: ctx.activeMembershipId,
                tenantId: ctx.supplierTenantId,
                status: "ACTIVE",
            },
            select: {
                id: true,
                creditLimit: true,
                financialMode: true,
            },
        })

        if (!membership) {
            return NextResponse.json({ ok: false, error: "INVALID_MEMBERSHIP_CONTEXT" }, { status: 403 })
        }

        const creditLimit = toNumber(membership.creditLimit)

        const agg = await prisma.order.aggregate({
            where: {
                dealerMembershipId: ctx.activeMembershipId,
                salesChannel: "DEALER_B2B",
                status: { in: [...CREDIT_EXPOSURE_STATUSES] },
            },
            _sum: {
                dealerPrice: true as any,
                totalAmount: true as any,
            }
        } as any)

        const sumDealer = toNumber((agg as any)._sum?.dealerPrice)
        const sumTotal = toNumber((agg as any)._sum?.totalAmount)
        const exposureBase = sumDealer > 0 ? sumDealer : sumTotal

        const availableCredit = Math.max(0, creditLimit - exposureBase)

        const settings = await prisma.dealerNetworkSettings.findUnique({
            where: { tenantId: ctx.supplierTenantId },
            select: { creditPolicy: true }
        })

        return NextResponse.json({
            ok: true,
            membershipId: membership.id,
            creditLimit,
            exposureBase,
            availableCredit,
            currency: "TRY",
            creditPolicy: settings?.creditPolicy || "HARD_LIMIT"
        })
    } catch (e: any) {
        if (
            e?.message === "UNAUTHORIZED" ||
            e?.message === "NO_ACTIVE_MEMBERSHIP" ||
            e?.message === "INVALID_MEMBERSHIP_CONTEXT"
        ) {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "CREDIT_FETCH_FAILED" }, { status: 500 })
    }
}
