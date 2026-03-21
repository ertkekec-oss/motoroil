import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

const TAKE = 20

export async function GET(req: Request) {
    try {
        const ctx = await requireDealerContext()
        const url = new URL(req.url)
        const pageQuery = parseInt(url.searchParams.get("page") || "1", 10)
        const statusQuery = url.searchParams.get("status")

        const page = isNaN(pageQuery) || pageQuery < 1 ? 1 : pageQuery
        const skip = (page - 1) * TAKE

        const where: any = { dealerMembershipId: ctx.activeMembershipId }
        
        if (statusQuery && statusQuery !== "all") {
            where.status = statusQuery
        }

        const totalCount = await prisma.order.count({ where })
        const totalPages = Math.ceil(totalCount / TAKE) || 1

        const orders = await prisma.order.findMany({
            where,
            take: TAKE,
            skip: skip,
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

        return NextResponse.json({
            ok: true,
            items: orders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                orderDate: o.orderDate,
                totalAmount: typeof o.totalAmount === "object" ? Number(o.totalAmount) : Number(o.totalAmount),
                currency: o.currency ?? "TRY",
            })),
            totalPages,
            currentPage: page,
            totalCount
        })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "FETCH_ORDERS_FAILED" }, { status: 500 })
    }
}
