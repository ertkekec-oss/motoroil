import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerSession } from "@/lib/network/session"
import { readActiveMembershipId } from "@/lib/network/cookies"

export async function GET(req: Request) {
    try {
        const session = await requireDealerSession()
        const membershipId = await readActiveMembershipId()

        if (!membershipId) {
            return NextResponse.json({ ok: false, error: "MEMBERSHIP_REQUIRED" }, { status: 400 })
        }

        const membership = await prisma.dealerMembership.findUnique({
            where: { id: membershipId },
            select: { tenantId: true }
        })

        if (!membership) {
            return NextResponse.json({ ok: false, error: "MEMBERSHIP_NOT_FOUND" }, { status: 404 })
        }

        // Optimize: Find distinct categories from products that are in the catalog
        const products = await prisma.product.findMany({
            where: {
                category: { not: null },
                id: {
                    in: (await prisma.dealerCatalogItem.findMany({
                        where: {
                            supplierTenantId: membership.tenantId,
                            visibility: "VISIBLE",
                        },
                        select: { productId: true }
                    })).map(c => c.productId)
                }
            },
            select: { category: true },
            distinct: ['category']
        });

        const categories = products.map(p => p.category).filter(Boolean);

        return NextResponse.json({
            ok: true,
            categories
        })

    } catch (e: any) {
        if (e.message === "UNAUTHORIZED") {
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        }
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
    }
}
