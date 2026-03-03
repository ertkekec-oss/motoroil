import prisma from "@/lib/prisma"
import { requireDealerSession } from "./session"
import { readActiveMembershipId } from "./cookies"

export async function requireDealerContext() {
    const session = await requireDealerSession()
    const activeMembershipId = await readActiveMembershipId()

    if (!activeMembershipId) throw new Error("NO_ACTIVE_MEMBERSHIP")

    const dealerUser = await prisma.dealerUser.findUnique({
        where: { id: session.dealerUserId },
        select: { id: true, defaultDealerCompanyId: true },
    })
    if (!dealerUser) throw new Error("USER_INACTIVE")

    const membership = await prisma.dealerMembership.findFirst({
        where: {
            id: activeMembershipId,
            dealerUserId: dealerUser.id,
            status: "ACTIVE",
        },
        select: { id: true, tenantId: true, dealerCompanyId: true },
    })
    if (!membership) throw new Error("INVALID_MEMBERSHIP_CONTEXT")

    return {
        dealerUserId: dealerUser.id,
        dealerCompanyId: membership.dealerCompanyId, // Using the company associated to the membership
        activeMembershipId: membership.id,
        supplierTenantId: membership.tenantId,
    }
}
