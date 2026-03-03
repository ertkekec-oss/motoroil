import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

function toNumber(v: any) {
    return typeof v === "object" ? Number(v) : Number(v ?? 0)
}

export async function GET() {
    try {
        const ctx = await requireDealerContext()

        const cart = await prisma.dealerCart.findFirst({
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
                                unit: true,
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
                cart: { items: [], summary: { subTotal: 0, totalDiscount: 0, grandTotal: 0, discountPct: 0 } },
            })
        }

        // İskonto hesaplaması 
        const membership = await prisma.dealerMembership.findUnique({
            where: { id: ctx.activeMembershipId },
            select: { priceRule: { select: { discount: true, isActive: true } } },
        })

        const rule = membership?.priceRule?.isActive ? membership.priceRule : null
        const discountPct = rule ? toNumber(rule.discount) : 0

        let subTotal = 0
        let totalDiscount = 0
        let grandTotal = 0

        const items = cart.items.map((item) => {
            const listPrice = toNumber(item.product.price)
            const effectivePrice = discountPct > 0 ? Math.max(0, listPrice * (1 - discountPct / 100)) : listPrice

            const lineListTotal = listPrice * item.quantity
            const lineEffectiveTotal = effectivePrice * item.quantity
            const lineDiscount = lineListTotal - lineEffectiveTotal

            subTotal += lineListTotal
            totalDiscount += lineDiscount
            grandTotal += lineEffectiveTotal

            return {
                id: item.id, // Cart item ID
                productId: item.productId,
                name: item.product.name,
                code: item.product.code,
                stockQty: toNumber(item.product.stock),
                unit: item.product.unit,
                quantity: item.quantity,
                listPrice,
                effectivePrice,
                lineTotal: lineEffectiveTotal,
            }
        })

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
