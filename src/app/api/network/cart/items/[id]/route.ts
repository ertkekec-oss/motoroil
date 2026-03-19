import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireDealerContext()
        const { id } = await params

        if (!id) {
            return NextResponse.json({ ok: false, error: "INVALID_ITEM_ID" }, { status: 400 })
        }

        // Active Cart bul
        const cart = await prisma.dealerCart.findFirst({
            where: {
                membershipId: ctx.activeMembershipId,
                status: "ACTIVE",
            },
        })

        if (!cart) {
            return NextResponse.json({ ok: false, error: "CART_NOT_FOUND" }, { status: 404 })
        }

        // CartItem'ı sil
        // Sadece bu active cart'a ait olduğunu da teyit ederek sil
        await prisma.dealerCartItem.deleteMany({
            where: {
                id: id,
                cartId: cart.id, // Güvenlik çemberi
            },
        })

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "CART_ERROR" }, { status: 500 })
    }
}
