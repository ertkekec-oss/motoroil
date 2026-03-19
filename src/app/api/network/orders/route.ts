import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

const TAKE = 20

export async function GET(req: Request) {
    try {
        const ctx = await requireDealerContext()
        const url = new URL(req.url)
        const cursor = url.searchParams.get("cursor")

        const orders = await prisma.order.findMany({
            where: { dealerMembershipId: ctx.activeMembershipId },
            take: TAKE + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { orderDate: "desc" },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                orderDate: true,
                totalAmount: true,
                currency: true,
            }
        } as any)

        const hasMore = orders.length > TAKE
        const page = hasMore ? orders.slice(0, TAKE) : orders
        const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null

        return NextResponse.json({
            ok: true,
            items: page.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                orderDate: o.orderDate,
                totalAmount: typeof o.totalAmount === "object" ? Number(o.totalAmount) : Number(o.totalAmount),
                currency: o.currency ?? "TRY",
            })),
            nextCursor,
        })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "FETCH_ORDERS_FAILED" }, { status: 500 })
    }
}
