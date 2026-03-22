import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerSession } from "@/lib/network/session"
import { readActiveMembershipId } from "@/lib/network/cookies"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireDealerSession()
        const membershipId = await readActiveMembershipId()

        const resolvedParams = await params;

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

        const catalogItem = await prisma.dealerCatalogItem.findFirst({
            where: {
                supplierTenantId: membership.tenantId,
                visibility: "VISIBLE",
                productId: resolvedParams.id
            },
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
                        b2bDescription: true,
                        ...(priceListId ? { productPrices: { where: { priceListId: priceListId }, select: { price: true } } } : {}),
                        variants: {
                            select: {
                                id: true,
                                stock: true
                            }
                        }
                    }
                }
            }
        });

        if (!catalogItem) {
            return NextResponse.json({ ok: false, error: "PRODUCT_NOT_FOUND" }, { status: 404 })
        }

        const prod = catalogItem.product;
        
        // 1. Check mapped PriceList from Cari Kategorisi
        let listPrice = null;
        if (priceListId && prod.productPrices && prod.productPrices.length > 0) {
            listPrice = Number(prod.productPrices[0].price);
        }

        // 2. Resolve Price: Override ListPrice / DealerCatalogItemPrice / Default ProductPrice
        const priceResolved = listPrice !== null 
            ? listPrice 
            : Number(catalogItem.price ?? prod.price ?? 0);

        const allCampaigns = await prisma.campaign.findMany({ where: { tenantId: membership.tenantId, isActive: true, deletedAt: null } });
        const campaigns = allCampaigns.filter(c => !c.channels || c.channels.length === 0 || c.channels.includes("B2B") || c.channels.includes("GLOBAL"));
        let appliedCampaign = null;
        let appliedPointsCampaign = null;

        campaigns.forEach(c => {
            if(!c.conditions) return;
            const { targetType, targetValue } = c.conditions;
            let match = false;
            
            if(targetType === "ALL") match = true;
            else if(targetType === "BRAND" && prod.brand === targetValue) match = true;
            else if(targetType === "CATEGORY" && prod.category === targetValue) match = true;
            else if(targetType === "PRODUCT" && (prod.code === targetValue || prod.name === targetValue)) match = true;

            if (match) {
                if (c.campaignType === "LOYALTY_POINTS" || c.type === "LOYALTY_POINTS") {
                    appliedPointsCampaign = c;
                } else {
                    appliedCampaign = c;
                }
            }
        });

        const variantValues = Array.isArray(prod.variants) ? prod.variants : []
        const variantStock = variantValues.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
        const totalStock = prod.stock + variantStock; // Main stock + variant stock

        return NextResponse.json({
            ok: true,
            product: {
                id: prod.id,
                name: prod.name,
                sku: prod.code,
                image: prod.imageUrl || null,
                category: prod.category || "Diğer",
                description: prod.b2bDescription || null,
                stock: totalStock,
                basePrice: Number(prod.price ?? 0),
                priceResolved,
                minOrderQty: catalogItem.minOrderQty,
                maxOrderQty: catalogItem.maxOrderQty,
                catalogItemId: catalogItem.id,
                campaign: appliedCampaign ? { name: appliedCampaign.name, type: appliedCampaign.campaignType || appliedCampaign.type, buyQuantity: appliedCampaign.conditions?.buyQuantity, rewardQuantity: appliedCampaign.conditions?.rewardQuantity, discountRate: appliedCampaign.discountRate } : null,
                pointsCampaign: appliedPointsCampaign ? { name: appliedPointsCampaign.name, type: appliedPointsCampaign.campaignType || appliedPointsCampaign.type, discountRate: appliedPointsCampaign.pointsRate || appliedPointsCampaign.discountRate } : null
            }
        });

    } catch (e: any) {
        if (e.message === "UNAUTHORIZED") {
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        }
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
    }
}
