import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

export async function GET() {
    try {
        const ctx = await requireDealerContext()

        const membership = await prisma.dealerMembership.findUnique({
            where: { id: ctx.activeMembershipId },
            select: {
                id: true,
                status: true,
                tenantId: true,
                creditLimit: true,
                tenant: { select: { id: true, name: true } },
                dealerCompany: { select: { id: true, companyName: true } },
            },
        })

        if (!membership || membership.status !== "ACTIVE") {
            return NextResponse.json({ ok: false, error: "INVALID_MEMBERSHIP_CONTEXT" }, { status: 403 })
        }

        const creditLimit =
            typeof membership.creditLimit === "object"
                ? Number(membership.creditLimit)
                : membership.creditLimit

        const balance = 0; // T1.2'de Bakiye MVP için şimdilik 0 sabitlendi

        return NextResponse.json({
            ok: true,
            me: {
                dealerUserId: ctx.dealerUserId,
                dealerCompanyId: ctx.dealerCompanyId,
                dealerCompanyName: membership.dealerCompany?.companyName ?? null,

                activeMembershipId: membership.id,
                supplierTenantId: membership.tenantId,
                supplierName: membership.tenant?.name ?? "Tedarikçi",

                creditLimit,
                balance,
                currency: "TRY",
            },
        })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 })
    }
}
