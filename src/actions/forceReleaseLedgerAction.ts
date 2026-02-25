"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseFunds } from "@/services/payouts/releaseFunds";

export async function forceReleaseLedgerAction(networkPaymentId: string) {
    const session: any = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "admin")) {
        return { ok: false, message: "Unauthorized action." };
    }

    try {
        const payment = await prisma.networkPayment.findUnique({
            where: { id: networkPaymentId }
        });

        if (!payment) return { ok: false, message: "Payment record not found." };
        if (payment.payoutStatus === 'RELEASED') return { ok: false, message: "Payout already released." };
        if (payment.status !== 'PAID') return { ok: false, message: "Payment is not in PAID status." };

        const order = await prisma.networkOrder.findUnique({
            where: { id: payment.networkOrderId }
        });

        if (!order) return { ok: false, message: "Associated order not found." };

        // Attempt release via the core mock
        const result = await releaseFunds(payment);
        if (!result.success) {
            return { ok: false, message: result.errorMessage || "Force release payout service failed." };
        }

        // Apply ledger transactions atomically identical to normal delivery confirmation
        await prisma.$transaction(async (tx) => {
            await tx.networkPayment.update({
                where: { id: payment.id },
                data: {
                    payoutStatus: 'RELEASED',
                    releasedAt: new Date(),
                    releaseAttemptKey: `${order.id}:FORCE_RELEASE_${Date.now()}`
                }
            });

            const netAmount = Number(order.subtotalAmount) - Number(order.commissionAmount);
            await tx.sellerBalanceLedger.upsert({
                where: { idempotencyKey: `${order.id}:CREDIT` },
                create: {
                    sellerCompanyId: order.sellerCompanyId,
                    networkOrderId: order.id,
                    amount: netAmount,
                    currency: order.currency,
                    type: 'CREDIT',
                    idempotencyKey: `${order.id}:CREDIT`
                },
                update: {}
            });

            await tx.platformCommissionLedger.upsert({
                where: { idempotencyKey: `${order.id}:COMMISSION` },
                create: {
                    networkOrderId: order.id,
                    amount: order.commissionAmount,
                    currency: order.currency,
                    idempotencyKey: `${order.id}:COMMISSION`
                },
                update: {}
            });

            // Record Inbox Event Event
            if (result.providerEventId) {
                await tx.payoutEventInbox.create({
                    data: {
                        provider: payment.provider,
                        providerEventId: result.providerEventId,
                        raw: result.rawPayload || {},
                        status: 'PROCESSED',
                        processedAt: new Date()
                    }
                });
            }
        });

        revalidatePath('/admin/ops/ledgers');
        return { ok: true, message: "Ledgers written & payout released successfully." };
    } catch (e: any) {
        return { ok: false, message: e.message || "An unexpected error occurred during force release." };
    }
}
