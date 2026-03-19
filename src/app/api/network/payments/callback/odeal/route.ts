import { NextResponse } from "next/server";
import { prismaRaw as prisma } from "@/lib/prisma";
import { getPaymentProviderAdapter } from "@/lib/network/payments/getProvider";
import { markOrderPaidIfEligible } from "@/lib/network/payments/orderStatus";
import { releaseReservationForOrder } from "@/lib/network/inventory/reservation";
import { enqueueAccountingEvent } from "@/lib/network/accounting/outbox";

export async function POST(req: Request) {
    // Ödeal returnUrl callback payload can vary. We accept form or json and then check-status by externalId/intent.
    const ct = req.headers.get("content-type") || "";
    let payload: any = {};

    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
        const fd = await req.formData();
        for (const [k, v] of fd.entries()) payload[k] = v;
    } else {
        try { payload = await req.json(); } catch { payload = {}; }
    }

    // Best-effort: try externalId / id / referenceCode from payload
    const externalId = (payload.externalId ?? payload.external_id ?? payload.intentId ?? payload.intent_id) as string | undefined;
    const providerId = (payload.id ?? payload.paymentId ?? payload.payment_id) as string | undefined;

    // Find by intentId=externalId first (we used intentId as externalId)
    let intent = externalId
        ? await prisma.dealerPaymentIntent.findUnique({
            where: { id: externalId },
            select: { id: true, supplierTenantId: true, referenceCode: true },
        })
        : null;

    // fallback: find by referenceCode if provider id provided
    if (!intent && providerId) {
        intent = await prisma.dealerPaymentIntent.findFirst({
            where: { provider: "ODEAL", referenceCode: String(providerId) },
            select: { id: true, supplierTenantId: true, referenceCode: true },
        });
    }

    if (!intent) return NextResponse.json({ ok: false, error: "INTENT_NOT_FOUND" }, { status: 404 });

    const adapter = await getPaymentProviderAdapter(intent.supplierTenantId);

    await prisma.dealerPaymentIntent.update({
        where: { id: intent.id },
        data: { status: "PROCESSING" },
    });

    const vr = await adapter.verifyWithCallback({
        referenceCode: intent.referenceCode ?? String(providerId ?? intent.id),
        payload,
        intentId: intent.id,
    });

    const nextStatus =
        vr.status === "SUCCEEDED" ? "SUCCEEDED" :
            vr.status === "FAILED" ? "FAILED" :
                vr.status === "CANCELLED" ? "CANCELLED" :
                    "PROCESSING";

    await prisma.dealerPaymentIntent.update({
        where: { id: intent.id },
        data: {
            status: nextStatus,
            verifiedAt: new Date(),
            providerResult: vr.raw as any ?? undefined,
        },
    });

    if (nextStatus === "SUCCEEDED") {
        const fullIntent = await prisma.dealerPaymentIntent.findUnique({
            where: { id: intent.id },
            select: { orderId: true, supplierTenantId: true, referenceCode: true, dealerMembershipId: true },
        });

        if (fullIntent?.orderId) {
            await markOrderPaidIfEligible({
                orderId: fullIntent.orderId,
                supplierTenantId: fullIntent.supplierTenantId,
                paidMode: "PAID_PENDING_APPROVAL",
                paymentProvider: "ODEAL",
                paymentRef: fullIntent.referenceCode ?? intent.id,
            });
        }

        if (fullIntent?.dealerMembershipId) {
            const membership = await prisma.dealerMembership.findUnique({
                where: { id: fullIntent.dealerMembershipId },
                select: { financialMode: true },
            });
            if (membership?.financialMode === "ERP_POSTING") {
                enqueueAccountingEvent({
                    tenantId: fullIntent.supplierTenantId,
                    event: "PAYMENT_SUCCEEDED",
                    entityId: intent.id,
                }).catch(e => console.error("Accounting enqueue failed", e));
            }
        }
    } else if (nextStatus === "FAILED" || nextStatus === "CANCELLED") {
        const fullIntent = await prisma.dealerPaymentIntent.findUnique({
            where: { id: intent.id },
            select: { orderId: true, supplierTenantId: true },
        });

        if (fullIntent?.orderId) {
            await releaseReservationForOrder({
                orderId: fullIntent.orderId,
                supplierTenantId: fullIntent.supplierTenantId,
            });
        }
    }

    // Redirect user to UI success page instead of returning JSON
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.redirect(new URL(`/network/payment/result?intentId=${intent.id}`, baseUrl || req.url));
}
