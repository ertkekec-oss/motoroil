import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"
import { getSupplierPaymentConfigOrThrow } from "@/lib/network/payments/config"

export async function POST(req: Request) {
    try {
        const ctx = await requireDealerContext()
        const { orderId } = await req.json()
        if (!orderId) {
            return NextResponse.json({ ok: false, error: "MISSING_ORDER_ID" }, { status: 400 })
        }

        // Load Order
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                dealerMembershipId: ctx.activeMembershipId,
            }
        } as any)

        if (!order) {
            return NextResponse.json({ ok: false, error: "ORDER_NOT_FOUND" }, { status: 404 })
        }

        // Validate Status
        if (order.status !== "APPROVED") {
            return NextResponse.json({ ok: false, error: `CANNOT_PAY_ORDER_STATUS_${order.status}` }, { status: 400 })
        }

        // Load payment config
        let config;
        try {
            config = await getSupplierPaymentConfigOrThrow(ctx.supplierTenantId)
        } catch (err: any) {
            return NextResponse.json({ ok: false, error: err.message || "PAYMENT_NOT_CONFIGURED" }, { status: 400 })
        }

        // Generates a mock checkout payload based on the provider config
        const referenceCode = `PAY_${order.orderNumber}_${Date.now()}`

        // Optionally check if there is an existing PENDING intent for this exact order to prevent duplicates

        const intent = await prisma.dealerPaymentIntent.create({
            data: {
                tenantId: ctx.supplierTenantId,
                dealerId: ctx.activeMembershipId,
                amount: order.totalAmount,
                provider: config.provider,
                status: "PENDING",
                referenceCode,
                orderId: order.id
            }
        })

        // Simulated provider checkout link (will be replaced by actual iyzico/odeal call)
        let checkoutUrl = `/network/checkout/mock-payment?ref=${referenceCode}`

        return NextResponse.json({
            ok: true,
            intentId: intent.id,
            checkoutUrl,
            provider: config.provider,
            referenceCode
        })
    } catch (error: any) {
        console.error("PaymentIntentError", error)
        return NextResponse.json({ ok: false, error: "PAYMENT_INTENT_FAILED" }, { status: 500 })
    }
}
