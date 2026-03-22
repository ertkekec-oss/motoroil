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
            select: { tenantId: true, dealerCompanyId: true, categoryId: true }
        })

        let priceListId = null;
        if (membership && membership.categoryId) {
            const custCat = await prisma.customerCategory.findUnique({ where: { id: membership.categoryId } });
            if (custCat) priceListId = custCat.priceListId;
        }

        if (!membership) {
            return NextResponse.json({ ok: false, error: "MEMBERSHIP_NOT_FOUND" }, { status: 404 })
        }

        const url = new URL(req.url)
        const q = url.searchParams.get("q") || ""
        const take = parseInt(url.searchParams.get("take") || "20", 10)
        const page = parseInt(url.searchParams.get("page") || "1", 10)
        let cursor = url.searchParams.get("cursor") || undefined
        const cat = url.searchParams.get("category") || ""

        const totalCount = await prisma.dealerCatalogItem.count({
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
            }
        });
        const totalPages = Math.ceil(totalCount / take);
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
            take: take,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : { skip: Math.max(0, (page - 1) * take) }),
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
                        brand: true,
                        description: true,
                        b2bDescription: true,
                        pointsRate: true,
                        minOrderQty: true,
                        ...(priceListId ? { productPrices: { where: { priceListId: priceListId }, select: { price: true } } } : {}),
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

        const campaigns = await prisma.campaign.findMany({ where: { tenantId: membership.tenantId, isActive: true, deletedAt: null, campaignType: "BUY_X_GET_Y" } });
        let nextCursor: string | undefined = undefined;
        if (catalogItems.length > take) {
            const nextItem = catalogItems.pop();
            nextCursor = nextItem?.id;
        }

        const products = catalogItems.map((item: any) => {
            const prod = item.product;
            
            // 1. Check mapped PriceList from Cari Kategorisi
            let resolvedPrice = Number(prod.price);
            if (priceListId && prod.productPrices && prod.productPrices.length > 0) {
                resolvedPrice = Number(prod.productPrices[0].price);
            }

            // 2. Check stock (total or variant)
            const resolvedStock = prod.stock;

            // 3. Find if any campaign matches this product
            const campaign = campaigns.find(c => {
                if (c.targetType === "ALL") return true;
                if (c.targetType === "CATEGORY" && prod.category === c.targetValue) return true;
                if (c.targetType === "PRODUCT" && prod.id === c.targetValue) return true;
                return false;
            });

            return {
                id: prod.id,
                name: prod.name,
                sku: prod.code,
                image: prod.imageUrl,
                category: prod.category,
                priceResolved: resolvedPrice,
                basePrice: Number(prod.price),
                stock: resolvedStock,
                brand: prod.brand,
                description: prod.description,
                b2bDescription: prod.b2bDescription,
                pointsRate: Number(prod.pointsRate || 0),
                minOrderQty: prod.minOrderQty,
                campaign: campaign ? {
                    id: campaign.id,
                    name: campaign.name,
                    buyQuantity: campaign.buyQuantity,
                    rewardQuantity: campaign.rewardQuantity
                } : null,
                catalogItemId: item.id
            }
        });

        return NextResponse.json({
            ok: true,
            products,
            pagination: {
                totalCount,
                totalPages,
                currentPage: page
            },
            nextCursor
        })

    } catch (e: any) {
        console.error("[CATALOG_API_ERROR]", e)
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
    }
}
