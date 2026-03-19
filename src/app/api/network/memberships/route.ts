import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerSession } from "@/lib/network/session"

export async function GET() {
    const session = await requireDealerSession()

    const user = await prisma.dealerUser.findUnique({
        where: { id: session.dealerUserId },
        select: {
            id: true,
            defaultDealerCompanyId: true,
            memberships: { select: { id: true } },
        },
    })
    if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })

    const companyId = user.defaultDealerCompanyId
    if (!companyId) {
        return NextResponse.json({
            ok: true,
            memberships: [],
            needsCompany: true,
        })
    }

    const memberships = await prisma.dealerMembership.findMany({
        where: {
            dealerCompanyId: companyId,
            status: "ACTIVE",
        },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            status: true,
            creditLimit: true,
            tenantId: true,
            tenant: { select: { id: true, name: true } },
        },
    })

    return NextResponse.json({
        ok: true,
        memberships: memberships.map((m) => ({
            id: m.id,
            supplierTenantId: m.tenantId,
            supplierName: m.tenant?.name ?? "Tedarikçi",
            creditLimit: Number(m.creditLimit || 0),
            balance: 0, // V1'de şimdilik bakiye alanı olmadığı için 0
        })),
    })
}
