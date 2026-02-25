import { prisma } from '@/lib/prisma';
import { releaseFunds } from '../payouts/releaseFunds';

export interface ConfirmDeliveryResult {
    success: boolean;
    alreadyConfirmed?: boolean;
    orderId: string;
    payoutReleased: boolean;
    message?: string;
}

export async function confirmDelivery(orderId: string, buyerCompanyId: string): Promise<ConfirmDeliveryResult> {
    // 1. Fetch & Validate Order
    const order = await prisma.networkOrder.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        throw Object.assign(new Error('Order not found'), { httpCode: 404 });
    }

    if (order.buyerCompanyId !== buyerCompanyId) {
        throw Object.assign(new Error('Unauthorized: Only buyer can confirm delivery'), { httpCode: 403 });
    }

    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
        throw Object.assign(new Error(`Cannot confirm delivery for order in ${order.status} state.`), { httpCode: 400 });
    }

    // Checking if already completed in DB state for idempotency without throwing
    if (order.confirmedAt || order.status === 'COMPLETED') {
        return { success: true, alreadyConfirmed: true, orderId: order.id, payoutReleased: false, message: 'Already confirmed' };
    }

    // 2. Validate all shipments delivered (Strict requirement)
    const pendingShipmentsCount = await prisma.shipment.count({
        where: {
            networkOrderId: orderId,
            NOT: { status: 'DELIVERED' }
        }
    });

    if (pendingShipmentsCount > 0) {
        throw Object.assign(new Error(`Cannot confirm delivery. There are ${pendingShipmentsCount} shipments not yet marked as DELIVERED.`), { httpCode: 400 });
    }

    const completionKey = `${orderId}:CONFIRM`;

    // 3. Optimistic Lock: Attempt to lock the order completion operation
    const updatedCount = await prisma.networkOrder.updateMany({
        where: {
            id: orderId,
            status: 'DELIVERED',
            confirmedAt: null
        },
        data: {
            status: 'COMPLETED',
            confirmedAt: new Date(),
            completedAt: new Date(),
            completionKey
        }
    });

    if (updatedCount.count === 0) {
        // Race condition handled: another request confirmed it
        return { success: true, alreadyConfirmed: true, orderId: order.id, payoutReleased: false, message: 'Race condition mitigated - already confirmed' };
    }

    console.info(JSON.stringify({
        event: 'order_completed',
        orderId,
        buyerCompanyId,
        timestamp: new Date().toISOString()
    }));

    // 4. Fetch the associated Payment
    const payment = await prisma.networkPayment.findFirst({
        where: {
            networkOrderId: orderId,
            status: 'PAID'
        },
        orderBy: { updatedAt: 'desc' }
    });

    if (!payment) {
        console.warn(`[Escrow] Order ${orderId} confirmed but no PAID NetworkPayment found.`);
        return { success: true, orderId: order.id, payoutReleased: false, message: 'Ledgers bypass - No tracking payment found' };
    }

    // 5. Escrow Payment - Payout Handling
    if (payment.mode === 'ESCROW' && payment.payoutStatus === 'INITIATED') {
        const releaseAttemptKey = `${orderId}:RELEASE`;

        // Let's release the funds natively and mock 
        const releaseResult = await releaseFunds(payment);

        if (!releaseResult.success) {
            // Rollback wouldn't affect the fact that the buyer accepted the goods.
            // We flag payment as failed payout. An admin needs to click "Retry Payout".
            await prisma.networkPayment.update({
                where: { id: payment.id },
                data: { payoutStatus: 'FAILED' }
            });
            // Log the payout error to generic inbox
            await prisma.payoutEventInbox.create({
                data: {
                    provider: payment.provider,
                    providerEventId: `failed_${Date.now()}_${payment.id}`,
                    raw: { reason: "Payout hook failed", trace: releaseResult.errorMessage },
                    status: 'FAILED',
                }
            });

            console.error(JSON.stringify({
                event: 'payout_failed',
                orderId,
                paymentId: payment.id,
                provider: payment.provider,
                error: releaseResult.errorMessage
            }));

            return { success: true, orderId, payoutReleased: false, message: 'Delivery confirmed but escrow payout failed' };
        }

        // Apply ledger transactions atomically 
        await prisma.$transaction(async (tx) => {
            await tx.networkPayment.update({
                where: { id: payment.id },
                data: {
                    payoutStatus: 'RELEASED',
                    releasedAt: new Date(),
                    releaseAttemptKey
                }
            });

            // Seller Credit Ledger
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
                update: {} // No-op for repeats
            });

            // Platform Commission Ledger
            await tx.platformCommissionLedger.upsert({
                where: { idempotencyKey: `${orderId}:COMMISSION` },
                create: {
                    networkOrderId: orderId,
                    amount: order.commissionAmount,
                    currency: order.currency,
                    idempotencyKey: `${orderId}:COMMISSION`
                },
                update: {} // No-op for repeats
            });

            // Log success
            if (releaseResult.providerEventId) {
                await tx.payoutEventInbox.create({
                    data: {
                        provider: payment.provider,
                        providerEventId: releaseResult.providerEventId,
                        raw: releaseResult.rawPayload || {},
                        status: 'PROCESSED',
                        processedAt: new Date()
                    }
                });
            }
        });

        console.info(JSON.stringify({
            event: 'payout_released',
            orderId,
            paymentId: payment.id,
            provider: payment.provider,
            amount: payment.amount,
            timestamp: new Date().toISOString()
        }));

        return { success: true, orderId, payoutReleased: true, message: 'Delivery confirmed & Payout released' };
    }

    // 6. Direct Payment - Just ledger update representing transaction history 
    if (payment.mode === 'DIRECT') {
        await prisma.$transaction(async (tx) => {
            // Direct Mode: Funds went directly to Seller. We log for bookkeeping only.
            await tx.sellerBalanceLedger.upsert({
                where: { idempotencyKey: `${orderId}:CREDIT` },
                create: {
                    sellerCompanyId: order.sellerCompanyId,
                    networkOrderId: orderId,
                    amount: order.totalAmount, // Usually Direct pays the whole.
                    currency: order.currency,
                    type: 'CREDIT',
                    idempotencyKey: `${orderId}:CREDIT`
                },
                update: {}
            });

            // We could still deduct commission if Marketplace charges an invoice later.
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
        });
        return { success: true, orderId, payoutReleased: false, message: 'Delivery confirmed for Direct payment' };
    }

    return { success: true, orderId, payoutReleased: false };
}
