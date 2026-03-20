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

        // Fetch all categories for visible catalog items
        // Since Prisma doesn't support grouping by joined selection easily,
        // we'll fetch the items and map them uniquely.
        // It's B2B so a few hundred/thousand active items is typical and fast to distinct.
        const items = await prisma.dealerCatalogItem.findMany({
            where: {
                supplierTenantId: membership.tenantId,
                visibility: "VISIBLE",
                product: {
                    category: {
                        not: null
                    }
                }
            },
            select: {
                product: {
                    select: {
                        category: true
                    }
                }
            }
        });

        const categories = Array.from(new Set(items.map(item => item.product.category))).filter(Boolean);

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
