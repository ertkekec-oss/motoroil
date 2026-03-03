import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authorize, hasPermission } from "@/lib/auth"
import { auditLog } from "@/lib/audit/log"

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
        const body = await req.json().catch(() => ({}))
        const reason = body.reason || "Supplier Rejected"

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                select: {
                    id: true,
                    company: { select: { tenantId: true } },
                    status: true,
                    items: true,
                    reservationReleasedAt: true,
                },
            })

            if (!order) {
                throw new Error("NOT_FOUND")
            }

            if (order.company.tenantId !== user.tenantId) {
                throw new Error("FORBIDDEN")
            }

            if (order.status === "REJECTED") {
                return { status: "REJECTED", info: "Already rejected" }
            }

            if (order.status !== "PENDING_APPROVAL" && order.status !== "PAID_PENDING_APPROVAL") {
                // Sprint 3.2'de Refund eklenecek, su an APPROVED iade/reject edilmiyor.
                // Veya eklenecekse buraya ozel mantik gelmeli, bu asamada engelliyoruz.
                if (order.status === "APPROVED" || order.status === "PAID") {
                    throw new Error("INVALID_STATE")
                }
            }

            if (order.reservationReleasedAt) {
                await tx.order.update({
                    where: { id },
                    data: { status: "REJECTED" },
                })
                return { status: "REJECTED" }
            }

            const items = (order.items as any[]) ?? []
            for (const item of items) {
                const productId = String(item.productId ?? item.id ?? "")
                const qty = Number(item.quantity ?? 0)
                if (productId && qty > 0) {
                    await tx.product.updateMany({
                        where: { id: productId, reservedStock: { gte: qty } },
                        data: { reservedStock: { decrement: qty } },
                    })
                }
            }

            await tx.order.update({
                where: { id },
                data: { status: "REJECTED", reservationReleasedAt: new Date() },
            })

            // NOTE: Could save 'reason' to a log or as a separate comment entity here.

            return { status: "REJECTED" }
        })

        await auditLog({
            tenantId: user.tenantId,
            actorUserId: user.id,
            type: "ORDER_REJECTED",
            entityType: "Order",
            entityId: id,
            meta: { reason },
        });

        return NextResponse.json({ ok: true, status: result.status, info: (result as any).info });

    } catch (error: any) {
        if (error.message === "NOT_FOUND") return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 })
        if (error.message === "FORBIDDEN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
        if (error.message === "INVALID_STATE") return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 400 })

        return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 })
    }
}
