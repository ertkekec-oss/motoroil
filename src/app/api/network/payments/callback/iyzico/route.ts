import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPaymentProviderAdapter } from "@/lib/network/payments/getProvider";
import { markOrderPaidIfEligible } from "@/lib/network/payments/orderStatus";
import { releaseReservationForOrder } from "@/lib/network/inventory/reservation";
import { enqueueAccountingEvent } from "@/lib/network/accounting/outbox";

export async function POST(req: Request) {
    // iyzico posts token to callbackUrl (form POST). We accept both form or json.
    const ct = req.headers.get("content-type") || "";
    let token: string | null = null;

    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
        const fd = await req.formData();
        token = (fd.get("token") as string) ?? null;
    } else {
        try {
            const j = await req.json();
            token = (j?.token as string) ?? null;
        } catch {
            token = null;
        }
    }

    if (!token) return NextResponse.json({ ok: false, error: "MISSING_TOKEN" }, { status: 400 });

    // Find intent by referenceCode=token (we stored it that way)
    const intent = await prisma.dealerPaymentIntent.findFirst({
        where: { provider: "IYZICO", referenceCode: token },
        select: { id: true, supplierTenantId: true, status: true },
    });

    if (!intent) return NextResponse.json({ ok: false, error: "INTENT_NOT_FOUND" }, { status: 404 });

    const adapter = await getPaymentProviderAdapter(intent.supplierTenantId);

    // mark processing (idempotent)
    await prisma.dealerPaymentIntent.update({
        where: { id: intent.id },
        data: { status: "PROCESSING" },
    });

    const vr = await adapter.verifyWithCallback({ referenceCode: token, payload: { token }, intentId: intent.id });

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
            paidAmount: vr.paidAmount ?? undefined,
        },
    });

    if (nextStatus === "SUCCEEDED") {
        const fullIntent = await prisma.dealerPaymentIntent.findUnique({
            where: { id: intent.id },
            select: { orderId: true, supplierTenantId: true, dealerMembershipId: true },
        });

        if (fullIntent?.orderId) {
            await markOrderPaidIfEligible({
                orderId: fullIntent.orderId,
                supplierTenantId: fullIntent.supplierTenantId,
                paidMode: "PAID_PENDING_APPROVAL",
                paymentProvider: "IYZICO",
                paymentRef: token,
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
