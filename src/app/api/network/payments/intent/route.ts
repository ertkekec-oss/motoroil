import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireDealerContext } from "@/lib/network/context";
import { getPaymentProviderAdapter } from "@/lib/network/payments/getProvider";
import { PaymentScope } from "@/lib/network/payments/types";

function assertString(x: any, name: string) {
    if (typeof x !== "string" || !x) throw new Error(`INVALID_${name}`);
    return x;
}

export async function POST(req: Request) {
    try {
        const ctx = await requireDealerContext();
        const body = await req.json();

        const idempotencyKey = assertString(body.idempotencyKey, "IDEMPOTENCY_KEY");
        const scope = (body.scope as PaymentScope) ?? "DEALER_B2B";
        const amount = assertString(body.amount, "AMOUNT");
        const currency = (body.currency as any) ?? "TRY";

        // Create (or fetch) intent idempotently
        const existing = await prisma.dealerPaymentIntent.findUnique({
            where: { idempotencyKey },
        });

        if (existing) {
            if (existing.status !== "CREATED" && existing.status !== "PENDING") {
                return NextResponse.json({
                    ok: true,
                    intentId: existing.id,
                    provider: existing.provider,
                    referenceCode: existing.referenceCode,
                    redirectUrl: existing.redirectUrl,
                    status: existing.status,
                });
            }
        }

        // Create a fresh intent row first (CREATED), then provider call, then update.
        const intent = await prisma.dealerPaymentIntent.upsert({
            where: { idempotencyKey },
            update: {},
            create: {
                supplierTenantId: ctx.supplierTenantId,
                dealerMembershipId: ctx.activeMembershipId,
                scope,
                amount,
                currency,
                status: "CREATED",
                idempotencyKey,
                orderId: body.orderId
            },
        });

        const adapter = await getPaymentProviderAdapter(ctx.supplierTenantId);

        const callbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL!;
        if (!callbackBaseUrl) throw new Error("MISSING_NEXT_PUBLIC_APP_URL");

        const result = await adapter.createIntent({
            intentId: intent.id,
            scope,
            amount,
            currency,
            callbackBaseUrl,
            successUrl: `${process.env.NEXT_PUBLIC_PORTAL_BASE_PATH ?? "/network"}/orders`, // optional
            failUrl: `${process.env.NEXT_PUBLIC_PORTAL_BASE_PATH ?? "/network"}/cart`,
            supplierTenantId: ctx.supplierTenantId,
            dealerMembershipId: ctx.activeMembershipId,
            idempotencyKey,
            buyer: {
                name: body.buyer?.name,
                email: body.buyer?.email,
                phoneE164: body.buyer?.phoneE164,
                city: body.buyer?.city,
                address: body.buyer?.address,
            },
            orderId: body.orderId,
        });

        const updated = await prisma.dealerPaymentIntent.update({
            where: { id: intent.id },
            data: {
                provider: result.provider,
                referenceCode: result.referenceCode,
                redirectUrl: result.redirectUrl,
                status: "REQUIRES_ACTION",
                providerData: result.raw as any ?? undefined,
            },
        });

        return NextResponse.json({
            ok: true,
            intentId: updated.id,
            provider: updated.provider,
            referenceCode: updated.referenceCode,
            redirectUrl: updated.redirectUrl,
            status: updated.status,
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? "PAYMENT_INTENT_CREATE_FAILED" }, { status: 400 });
    }
}
