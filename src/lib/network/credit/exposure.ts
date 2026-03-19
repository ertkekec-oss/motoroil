import { prismaRaw as prisma } from "@/lib/prisma"

export const CREDIT_EXPOSURE_STATUSES = [
    "PENDING_APPROVAL",
    "APPROVED",
    "PAID_PENDING_APPROVAL"
]

export async function computeExposureBase(ctx: {
    activeMembershipId: string
    supplierTenantId: string
}) {
    const membership = await prisma.dealerMembership.findFirst({
        where: {
            id: ctx.activeMembershipId,
            tenantId: ctx.supplierTenantId,
            status: "ACTIVE"
        },
        select: { creditLimit: true }
    })

    if (!membership) {
        throw new Error("ACTIVE_MEMBERSHIP_NOT_FOUND")
    }

    const creditLimit = Number(membership.creditLimit || 0)

    const company = await prisma.company.findFirst({
        where: { tenantId: ctx.supplierTenantId },
        select: { id: true },
        orderBy: { createdAt: "asc" }
    })

    const exposureAggr = await prisma.order.aggregate({
        where: {
            dealerMembershipId: ctx.activeMembershipId,
            companyId: company?.id ?? "",
            salesChannel: "DEALER_B2B",
            status: { in: CREDIT_EXPOSURE_STATUSES }
        },
        _sum: { dealerPrice: true, totalAmount: true }
    })

    // Use dealerPrice if available, fallback to totalAmount
    const exposureBase = Number(exposureAggr._sum.dealerPrice || exposureAggr._sum.totalAmount || 0)

    return { creditLimit, exposureBase }
}
