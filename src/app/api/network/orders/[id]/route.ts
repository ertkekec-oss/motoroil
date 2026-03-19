import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireDealerContext()
        const { id } = await params

        if (!id) {
            return NextResponse.json({ ok: false, error: "ORDER_ID_REQUIRED" }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
            where: {
                id,
                dealerMembershipId: ctx.activeMembershipId,
                salesChannel: "DEALER_B2B"
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                orderDate: true,
                totalAmount: true,
                items: true,
                currency: true
            },
            adminBypass: true
        } as any)

        if (!order) {
            return NextResponse.json({ ok: false, error: "ORDER_NOT_FOUND" }, { status: 404 })
        }

        return NextResponse.json({ ok: true, order })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "FETCH_ORDER_FAILED" }, { status: 500 })
    }
}
