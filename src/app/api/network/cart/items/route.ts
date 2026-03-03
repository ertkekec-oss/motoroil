import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

export async function POST(req: Request) {
    try {
        const ctx = await requireDealerContext()
        const body = await req.json().catch(() => ({}))

        const { productId } = body
        const quantity = Number(body.quantity)

        if (!productId || typeof quantity !== "number" || quantity < 1 || isNaN(quantity)) {
            return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 })
        }

        // Product'ın bu tedarikçiye ait olduğunu kontrol et ve stok doğrula
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                company: { tenantId: ctx.supplierTenantId }, // supplier kısıtlaması
                deletedAt: null,
            },
            select: { id: true, stock: true, reservedStock: true }, // "stockQty" şemada "stock"
        })

        if (!product) {
            return NextResponse.json({ ok: false, error: "PRODUCT_NOT_FOUND_OR_UNAUTHORIZED" }, { status: 404 })
        }

        // Get or Create Active Cart
        let cart = await prisma.dealerCart.findFirst({
            where: {
                membershipId: ctx.activeMembershipId,
                status: "ACTIVE",
            },
        })

        if (!cart) {
            cart = await prisma.dealerCart.create({
                data: {
                    membershipId: ctx.activeMembershipId,
                    supplierTenantId: ctx.supplierTenantId,
                },
            })
        }

        // Mevcut cart item'ı bulalım (Eğer varsa ürün adedini güncelleyip üstüne ekleyeceğiz)
        const existingItem = await prisma.dealerCartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId,
                },
            },
            select: { id: true, quantity: true },
        })

        let finalQuantity = quantity

        // Eğer zaten o ürün sepette varsa üzerine ekleyelim
        if (existingItem) {
            finalQuantity = existingItem.quantity + quantity
        }

        // Stok sınırını aşamaz
        const available = Number(product.stock) - Number(product.reservedStock)
        if (finalQuantity > available) {
            return NextResponse.json({ ok: false, error: "INSUFFICIENT_STOCK" }, { status: 400 })
        }

        if (existingItem) {
            await prisma.dealerCartItem.update({
                where: { id: existingItem.id },
                data: { quantity: finalQuantity },
            })
        } else {
            await prisma.dealerCartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    quantity: finalQuantity,
                },
            })
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "CART_ERROR" }, { status: 500 })
    }
}
