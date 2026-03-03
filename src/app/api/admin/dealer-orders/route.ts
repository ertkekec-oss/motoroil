import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authorize, hasPermission } from "@/lib/auth"

export async function GET(req: Request) {
    try {
        const auth = await authorize()
        if (!auth.authorized || !auth.user) {
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        }
        if (!hasPermission(auth.user, "admin_manage")) {
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
        }

        const user = auth.user
        const url = new URL(req.url)
        const statusParam = url.searchParams.get("status") || "PENDING_APPROVAL"
        const statuses = statusParam.split(",")

        const orders = await prisma.order.findMany({
            where: {
                company: { tenantId: user.tenantId },
                salesChannel: "DEALER_B2B",
                status: { in: statuses },
            },
            orderBy: { orderDate: "desc" },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                orderDate: true,
                totalAmount: true,
                currency: true,
                customerName: true,
                dealerMembership: {
                    select: {
                        dealerUser: { select: { name: true, email: true } },
                        dealerCompany: { select: { companyName: true } }
                    }
                }
            },
        })

        const items = orders.map((o) => {
            const paid = o.status === "PAID" || o.status === "PAID_PENDING_APPROVAL"
            return {
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                orderDate: o.orderDate,
                totalAmount: Number(o.totalAmount),
                currency: o.currency ?? "TRY",
                customerName: o.customerName,
                dealerMembership: o.dealerMembership,
                paid
            }
        })

        return NextResponse.json({ ok: true, items })
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: "FETCH_FAILED" }, { status: 500 })
    }
}
