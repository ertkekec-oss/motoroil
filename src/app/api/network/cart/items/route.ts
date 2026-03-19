import { NextResponse } from "next/server"
import { prismaRaw } from "@/lib/prisma"
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
        const product: any = await prismaRaw.product.findFirst({
            where: {
                id: productId,
                company: { tenantId: ctx.supplierTenantId }, // supplier kısıtlaması
                deletedAt: null,
            },
            select: { id: true, stock: true, reservedStock: true }, // "stockQty" şemada "stock"
        } as any)

        if (!product) {
            return NextResponse.json({ ok: false, error: "PRODUCT_NOT_FOUND_OR_UNAUTHORIZED" }, { status: 404 })
        }

        // Get or Create Active Cart
        let cart = await prismaRaw.dealerCart.findFirst({
            where: {
                membershipId: ctx.activeMembershipId,
                status: "ACTIVE",
            },
        })

        if (!cart) {
            cart = await prismaRaw.dealerCart.create({
                data: {
                    membershipId: ctx.activeMembershipId,
                    supplierTenantId: ctx.supplierTenantId,
                },
            })
        }

        // Mevcut cart item'ı bulalım (Eğer varsa ürün adedini güncelleyip üstüne ekleyeceğiz)
        const existingItem = await prismaRaw.dealerCartItem.findUnique({
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
            await prismaRaw.dealerCartItem.update({
                where: { id: existingItem.id },
                data: { quantity: finalQuantity },
            })
        } else {
            await prismaRaw.dealerCartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    quantity: finalQuantity,
                },
            })
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error("Cart POST Error:", error)
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "CART_ERROR", details: error.message }, { status: 500 })
    }
}
