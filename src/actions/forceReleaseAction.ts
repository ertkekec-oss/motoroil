"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseFunds } from "@/services/payouts/releaseFunds";

export async function forceReleaseAction(orderId: string) {
    const session: any = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const payment = await prisma.networkPayment.findFirst({
        where: { networkOrderId: orderId, status: 'PAID' },
        orderBy: { createdAt: 'desc' }
    });

    if (!payment) {
        throw new Error("No paid payment found for this order.");
    }

    if (payment.payoutStatus === 'RELEASED') {
        throw new Error("Payout already released.");
    }

    // Attempt release via the mock
    const result = await releaseFunds(payment);
    if (!result.success) {
        // Just throw back to client so they see it failed again
        throw new Error(result.errorMessage || "Force release API hook failed");
    }

    const order = await prisma.networkOrder.findUnique({
        where: { id: orderId }
    });

    // Apply ledger transactions atomically 
    await prisma.$transaction(async (tx) => {
        await tx.networkPayment.update({
            where: { id: payment.id },
            data: {
                payoutStatus: 'RELEASED',
                releasedAt: new Date(),
                releaseAttemptKey: `${orderId}:FORCE_RELEASE`
            }
        });

        if (order) {
            const netAmount = Number(order.subtotalAmount) - Number(order.commissionAmount);
            await tx.sellerBalanceLedger.upsert({
                where: { idempotencyKey: `${orderId}:CREDIT` },
                create: {
                    sellerCompanyId: order.sellerCompanyId,
                    networkOrderId: orderId,
                    amount: netAmount,
                    currency: order.currency,
                    type: 'CREDIT',
                    idempotencyKey: `${orderId}:CREDIT`
                },
                update: {}
            });

            await tx.platformCommissionLedger.upsert({
                where: { idempotencyKey: `${orderId}:COMMISSION` },
                create: {
                    networkOrderId: orderId,
                    amount: order.commissionAmount,
                    currency: order.currency,
                    idempotencyKey: `${orderId}:COMMISSION`
                },
                update: {}
            });
        }
    });

    revalidatePath('/admin/ops/payments');
    return { success: true };
}
