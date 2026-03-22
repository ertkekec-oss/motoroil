import { NextResponse } from "next/server"
import { prismaRaw } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

function toNumber(v: any) {
    return typeof v === "object" ? Number(v) : Number(v ?? 0)
}

export async function GET() {
    try {
        const ctx = await requireDealerContext()

        const cart = await prismaRaw.dealerCart.findFirst({
            where: {
                membershipId: ctx.activeMembershipId,
                status: "ACTIVE",
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                price: true,
                                stock: true,
                                reservedStock: true,
                                unit: true,
                                variants: { select: { stock: true } },
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        if (!cart) {
            return NextResponse.json({
                ok: true,
                cart: { items: [], summary: { subTotal: 0, totalDiscount: 0, grandTotal: 0, discountPct: 0, shippingFee: 0, shippingCost: 0, freeShippingThreshold: 0 } },
            })
        }

        // İskonto hesaplaması 
        const membership = await prismaRaw.dealerMembership.findUnique({
            where: { id: ctx.activeMembershipId },
            select: { categoryId: true, priceRule: { select: { discount: true, isActive: true } } },
        })

        const rule = membership?.priceRule?.isActive ? membership.priceRule : null
        const discountPct = rule ? toNumber(rule.discount) : 0

        let priceListId = null;
        if (membership && membership.categoryId) {
            const custCat = await prismaRaw.customerCategory.findUnique({ where: { id: membership.categoryId } });
            if (custCat) priceListId = custCat.priceListId;
        }

        const productIds = cart.items.map(i => i.productId);
        
        // Fetch explicit dealer catalog prices
        const catItems = await prismaRaw.dealerCatalogItem.findMany({
            where: { supplierTenantId: ctx.supplierTenantId, productId: { in: productIds } },
            select: { productId: true, price: true }
        });
        const catPriceMap = new Map();
        for (const c of catItems) {
            if (c.price !== null) catPriceMap.set(c.productId, toNumber(c.price));
        }

        // Fetch price lists
        let productPriceMap = new Map();
        if (priceListId) {
            const ppList = await prismaRaw.productPrice.findMany({
                where: { priceListId, productId: { in: productIds } },
                select: { productId: true, price: true }
            });
            for (const pp of ppList) {
                if (pp.price !== null) productPriceMap.set(pp.productId, toNumber(pp.price));
            }
        }

        let subTotal = 0
        let totalDiscount = 0
        let grandTotal = 0

        const items = cart.items.map((item) => {
            const listPriceRaw = productPriceMap.get(item.productId);
            const listPriceMapped = listPriceRaw !== undefined ? listPriceRaw : null;

            const catPriceRaw = catPriceMap.get(item.productId);
            const catPrice = catPriceRaw !== undefined ? catPriceRaw : null;
            
            const priceResolved = listPriceMapped !== null 
                ? listPriceMapped 
                : (catPrice !== null ? catPrice : toNumber(item.product.price));

            const listPrice = priceResolved;
            const effectivePrice = discountPct > 0 ? Math.max(0, listPrice * (1 - discountPct / 100)) : listPrice

            const lineListTotal = listPrice * item.quantity
            const lineEffectiveTotal = effectivePrice * item.quantity
            const lineDiscount = lineListTotal - lineEffectiveTotal

            const variantStock = Array.isArray(item.product.variants) ? item.product.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) : 0;
            const totalStock = Number(item.product.stock) + variantStock;
            const availableStock = Math.max(0, totalStock - Number(item.product.reservedStock || 0));

            subTotal += lineListTotal
            totalDiscount += lineDiscount
            grandTotal += lineEffectiveTotal

            return {
                id: item.id, // Cart item ID
                productId: item.productId,
                name: item.product.name,
                code: item.product.code,
                stockQty: availableStock,
                unit: item.product.unit,
                quantity: item.quantity,
                listPrice,
                effectivePrice,
                lineTotal: lineEffectiveTotal,
            }
        })

        const settings = await prismaRaw.dealerNetworkSettings.findUnique({
            where: { tenantId: ctx.supplierTenantId }
        });

        const shippingCost = settings?.shippingCost ? toNumber(settings.shippingCost) : 0;
        const freeShippingThreshold = settings?.freeShippingThreshold ? toNumber(settings.freeShippingThreshold) : 0;
        
        // Shipping fee calculation
        let shippingFee = 0;
        if (shippingCost > 0) {
            if (freeShippingThreshold > 0 && grandTotal < freeShippingThreshold) {
                shippingFee = shippingCost;
            } else if (freeShippingThreshold === 0) {
                // if there is no threshold but a fixed shipping cost, always apply
                shippingFee = shippingCost;
            }
        }
        
        // add shipping fee to grand total
        grandTotal += shippingFee;

        return NextResponse.json({
            ok: true,
            cart: {
                id: cart.id,
                items,
                summary: {
                    subTotal,
                    totalDiscount,
                    grandTotal,
                    discountPct,
                    shippingFee,
                    shippingCost,
                    freeShippingThreshold
                },
            },
        })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "CART_ERROR" }, { status: 500 })
    }
}
