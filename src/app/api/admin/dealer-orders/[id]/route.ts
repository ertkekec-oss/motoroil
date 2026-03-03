import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authorize, hasPermission } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await authorize()
        if (!auth.authorized || !auth.user) {
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        }
        if (!hasPermission(auth.user, "admin_manage")) {
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
        }

        const { id } = await params
        const user = auth.user

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                orderDate: true,
                totalAmount: true,
                currency: true,
                customerName: true,
                items: true,
                company: { select: { tenantId: true } }
            },
        })

        if (!order) {
            return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 })
        }

        // Ensure staff can only view orders belonging to their tenant's company
        if (order.company.tenantId !== user.tenantId) {
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
        }

        // Remove the company object from the response payload for safety
        const { company, ...orderData } = order

        return NextResponse.json({ ok: true, order: orderData })

    } catch (error: any) {
        return NextResponse.json({ ok: false, error: "FETCH_FAILED" }, { status: 500 })
    }
}
