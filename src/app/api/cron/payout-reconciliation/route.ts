import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth'; // Reusing for generic auth if needed
import { releaseFunds } from '@/services/payouts/releaseFunds';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        // Require Bearer token matching CRON_SECRET if it is configured in the environment
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Nightly reconciliation concept:
        // Find Completed orders safely where Payment was ESCROW and payout status sits in INITIATED without a release date
        // Note: A 30 minutes offset could apply, but for cron simplified version:
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

        const stuckPayments = await prisma.networkPayment.findMany({
            where: {
                mode: 'ESCROW',
                status: 'PAID',
                payoutStatus: 'INITIATED',
                releasedAt: null,
                order: {
                    status: 'COMPLETED',
                    completedAt: {
                        lte: thirtyMinsAgo
                    }
                }
            },
            include: { order: true },
            take: 50 // process in batches
        });

        if (stuckPayments.length === 0) {
            return NextResponse.json({ ok: true, message: 'No stuck payments found for reconciliation' });
        }

        console.info(`[Reconciliation] Found ${stuckPayments.length} stuck payouts. Attempting to release...`);

        const results = [];
        for (const payment of stuckPayments) {
            const orderId = payment.networkOrderId;
            try {
                // Retry mock logic via releaseFunds explicitly
                const releaseResult = await releaseFunds(payment);

                if (!releaseResult.success) {
                    results.push({ orderId, status: 'FAILED_RETRY', error: releaseResult.errorMessage });
                    continue;
                }

                const releaseAttemptKey = `${orderId}:RELEASE`;

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
                    const netAmount = Number(payment.order.subtotalAmount) - Number(payment.order.commissionAmount);
                    await tx.sellerBalanceLedger.upsert({
                        where: { idempotencyKey: `${orderId}:CREDIT` },
                        create: {
                            sellerCompanyId: payment.order.sellerCompanyId,
                            networkOrderId: orderId,
                            amount: netAmount,
                            currency: payment.order.currency,
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
                            amount: payment.order.commissionAmount,
                            currency: payment.order.currency,
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

                results.push({ orderId, status: 'RECONCILED' });
                console.info(JSON.stringify({
                    event: 'payout_reconciled',
                    orderId,
                    paymentId: payment.id,
                    timestamp: new Date().toISOString()
                }));

            } catch (e: any) {
                results.push({ orderId, status: 'ERROR', message: e.message });
                console.error(`[Reconciliation] Error processing ${orderId}: ${e.message}`);
            }
        }

        return NextResponse.json({ ok: true, processed: results.length, details: results });

    } catch (e: any) {
        console.error('Payout Reconciliation Cron Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
