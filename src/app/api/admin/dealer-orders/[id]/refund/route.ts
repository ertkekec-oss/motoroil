import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize, hasPermission } from "@/lib/auth";
import { getPaymentProviderAdapter } from "@/lib/network/payments/getProvider";
import { auditLog } from "@/lib/audit/log";
import { enqueueAccountingEvent } from "@/lib/network/accounting/outbox";

function mustStr(v: any, name: string) {
    if (typeof v !== "string" || !v) throw new Error(`INVALID_${name}`);
    return v;
}

function decStr(v: any, name: string) {
    const s = mustStr(v, name);
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`INVALID_${name}`);
    return s;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!hasPermission(auth.user, "admin_manage")) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const staff = auth.user;
    const { id: orderId } = await params;

    try {
        const body = await req.json();
        const idempotencyKey = mustStr(body.idempotencyKey, "IDEMPOTENCY_KEY");
        const amount = decStr(body.amount, "AMOUNT");
        const reason = typeof body.reason === "string" ? body.reason : undefined;

        // Idempotency: if refund already created with same key, return it.
        const existing = await prisma.dealerRefund.findUnique({
            where: { idempotencyKey },
            select: { id: true, status: true, providerResult: true },
        });
        if (existing) return NextResponse.json({ ok: true, refundId: existing.id, status: existing.status });

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: {
                    id: orderId,
                    companyId: staff.tenantId,
                    salesChannel: "DEALER_B2B",
                },
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    currency: true,
                    dealerMembership: { select: { financialMode: true } },
                },
            });

            if (!order) throw new Error("ORDER_NOT_FOUND");

            // Only allow refund if paid-like
            if (!["PAID", "PAID_PENDING_APPROVAL"].includes(order.status)) {
                throw new Error("ORDER_NOT_PAID");
            }

            // Find last succeeded PaymentIntent for this order
            const intent = await tx.dealerPaymentIntent.findFirst({
                where: {
                    supplierTenantId: staff.tenantId,
                    orderId: order.id,
                    status: "SUCCEEDED",
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    provider: true,
                    referenceCode: true,
                    currency: true,
                    providerResult: true,
                    paidAmount: true,
                },
            });

            if (!intent?.referenceCode) throw new Error("PAYMENT_INTENT_NOT_FOUND");
            if (!intent.provider) throw new Error("PAYMENT_PROVIDER_NOT_FOUND_ON_INTENT");

            // Create refund row as PENDING (fail-closed)
            const refund = await tx.dealerRefund.create({
                data: {
                    supplierTenantId: staff.tenantId,
                    orderId: order.id,
                    provider: intent.provider,
                    amount,
                    currency: intent.currency ?? order.currency ?? "TRY",
                    reason,
                    idempotencyKey,
                    createdByUserId: staff.id,
                    status: "PENDING",
                },
                select: { id: true, provider: true, currency: true },
            });

            // Move order status to REFUND_PENDING (idempotent)
            await tx.order.update({
                where: { id: order.id },
                data: { status: "REFUND_PENDING" },
            });

            return {
                refundId: refund.id,
                provider: intent.provider,
                referenceCode: intent.referenceCode,
                currency: refund.currency,
                providerResult: intent.providerResult,
                financialMode: order.dealerMembership?.financialMode
            };
        });

        await auditLog({
            tenantId: staff.tenantId,
            actorUserId: staff.id,
            type: "REFUND_REQUESTED",
            entityType: "DealerRefund",
            entityId: result.refundId,
            meta: { orderId, amount },
        });

        // Call provider outside tx (avoid holding DB locks)
        const adapter = await getPaymentProviderAdapter(staff.tenantId);

        // Optional: try to map iyzico transaction id from providerResult here.
        const referenceCode = mapRefundReference(result.provider, result.referenceCode, result.providerResult);

        const pr = await adapter.refund({
            referenceCode,
            amount,
            currency: result.currency,
            reason,
            idempotencyKey,
        });

        // Persist provider result
        await prisma.$transaction(async (tx) => {
            await tx.dealerRefund.update({
                where: { id: result.refundId },
                data: {
                    status: pr.status === "SUCCEEDED" ? "SUCCEEDED" : pr.status === "FAILED" ? "FAILED" : "PENDING",
                    providerRefundId: pr.providerRefundId,
                    providerResult: pr.raw ?? undefined,
                },
            });

            const orderNewStatus = pr.status === "SUCCEEDED" ? "REFUNDED" : pr.status === "FAILED" ? "REFUND_FAILED" : "REFUND_PENDING";

            await tx.order.update({ where: { id: orderId }, data: { status: orderNewStatus } });
        });

        if (pr.status === "SUCCEEDED" && result.financialMode === "ERP_POSTING") {
            enqueueAccountingEvent({
                tenantId: staff.tenantId,
                event: "REFUND_SUCCEEDED",
                entityId: result.refundId,
            }).catch(e => console.error("Accounting enqueue failed", e));
        }

        await auditLog({
            tenantId: staff.tenantId,
            actorUserId: staff.id,
            type: pr.status === "SUCCEEDED" ? "REFUND_SUCCEEDED" : pr.status === "FAILED" ? "REFUND_FAILED" : "REFUND_REQUESTED",
            entityType: "DealerRefund",
            entityId: result.refundId,
            meta: { providerStatus: pr.status },
        });

        return NextResponse.json({ ok: true, refundId: result.refundId, providerStatus: pr.status });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? "REFUND_FAILED" }, { status: 400 });
    }
}

// Provider-specific mapping (minimal)
function mapRefundReference(provider: string, referenceCode: string, providerResult: any) {
    if (provider === "IYZICO") {
        // Try extract paymentTransactionId from providerResult (store format may differ)
        // Common patterns: providerResult.paymentItems[0].paymentTransactionId
        const p0 = providerResult?.paymentItems?.[0]?.paymentTransactionId;
        if (p0) return String(p0);
    }
    return referenceCode;
}
