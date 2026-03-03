import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authorize, hasPermission } from "@/lib/auth"
import { auditLog } from "@/lib/audit/log"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await authorize()
        if (!auth.authorized || !auth.user) {
            return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
        }
        if (!hasPermission(auth.user, "admin_manage") && !hasPermission(auth.user, "b2b_manage")) {
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
        }

        const { id } = await params
        const user = auth.user

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                company: { select: { tenantId: true } },
                status: true,
                isLimitExceeded: true,
                paymentRequired: true,
                creditExceededAmount: true
            },
        })

        if (!order) {
            return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 })
        }

        if (order.company.tenantId !== user.tenantId) {
            return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
        }

        if (order.status === "APPROVED") {
            return NextResponse.json({ ok: true, status: "APPROVED", info: "Already approved" })
        }

        if (order.status !== "PENDING_APPROVAL" && order.status !== "PAID_PENDING_APPROVAL") {
            return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 400 })
        }

        if (order.paymentRequired === true && order.status === "PENDING_APPROVAL") {
            return NextResponse.json({ ok: false, error: "PAYMENT_REQUIRED_BEFORE_APPROVAL" }, { status: 409 })
        }

        const nextStatus = order.status === "PAID_PENDING_APPROVAL" ? "PAID" : "APPROVED"

        const result = await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
                where: { id },
                select: { status: true, items: true }
            })

            if (!currentOrder || (currentOrder.status !== "PENDING_APPROVAL" && currentOrder.status !== "PAID_PENDING_APPROVAL")) {
                return false
            }

            const items = (currentOrder.items as any[]) ?? []
            for (const it of items) {
                const productId = String(it.productId ?? it.id ?? "")
                const qty = Number(it.quantity ?? 0)
                if (!productId || qty <= 0) continue

                await tx.product.updateMany({
                    where: { id: productId, stock: { gte: qty }, reservedStock: { gte: qty } },
                    data: {
                        reservedStock: { decrement: qty },
                        stock: { decrement: qty },
                    },
                })
            }

            await tx.order.update({
                where: { id },
                data: { status: nextStatus },
            })

            return true
        })

        if (!result) {
            return NextResponse.json({ ok: false, error: "UPDATE_FAILED_OR_ALREADY_CHANGED" }, { status: 409 })
        }

        if (order.isLimitExceeded && !order.paymentRequired) {
            await auditLog({
                tenantId: user.tenantId,
                actorUserId: user.id,
                type: "CREDIT_LIMIT_OVERRIDE_APPROVE",
                entityType: "Order",
                entityId: id,
                meta: { exceededAmount: order.creditExceededAmount }
            });
        }

        await auditLog({
            tenantId: user.tenantId,
            actorUserId: user.id,
            type: "ORDER_APPROVED",
            entityType: "Order",
            entityId: id,
        });

        return NextResponse.json({ ok: true, status: nextStatus })
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 })
    }
}
