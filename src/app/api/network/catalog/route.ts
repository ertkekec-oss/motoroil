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
            select: { tenantId: true, dealerCompanyId: true }
        })

        if (!membership) {
            return NextResponse.json({ ok: false, error: "MEMBERSHIP_NOT_FOUND" }, { status: 404 })
        }

        const url = new URL(req.url)
        const q = url.searchParams.get("q") || ""
        const take = parseInt(url.searchParams.get("take") || "20", 10)
        let cursor = url.searchParams.get("cursor") || undefined
        const cat = url.searchParams.get("category") || ""

        const catalogItems = await prisma.dealerCatalogItem.findMany({
            where: {
                supplierTenantId: membership.tenantId,
                visibility: "VISIBLE",
                ...(q ? {
                    product: {
                        ...(cat ? { category: cat } : {}),
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { code: { contains: q, mode: 'insensitive' } }
                        ]
                    }
                } : (cat ? { product: { category: cat } } : {}))
            },
            take: take + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        price: true,
                        stock: true,
                        imageUrl: true,
                        category: true,
                        variants: {
                            select: {
                                id: true,
                                stock: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        let nextCursor: string | undefined = undefined;
        if (catalogItems.length > take) {
            const nextItem = catalogItems.pop();
            nextCursor = nextItem?.id;
        }

        const products = catalogItems.map(item => {
            const prod = item.product;
            const priceResolved = Number(item.price ?? prod.price ?? 0);

            const variantValues = Array.isArray(prod.variants) ? prod.variants : []
            const variantStock = variantValues.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
            const totalStock = prod.stock + variantStock; // Main stock + variant stock

            return {
                id: prod.id,
                name: prod.name,
                sku: prod.code,
                image: prod.imageUrl || null,
                category: prod.category || "Diğer",
                stock: totalStock,
                priceResolved,
                minOrderQty: item.minOrderQty,
                maxOrderQty: item.maxOrderQty,
                catalogItemId: item.id
            }
        });

        return NextResponse.json({
            ok: true,
            products,
            nextCursor
        })

    } catch (e: any) {
        if (e.message === "UNAUTHORIZED") {
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        }
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
    }
}
