import { Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/queue/redis';
import { prisma } from '../lib/prisma';
import { getPaymentProvider } from '../services/payments/providers';
import { createSettlementJournalEntry } from '../services/payments/accounting';
import { B2BJournalSourceType, EscrowAction } from '@prisma/client';

const createIntentWorker = new Worker('payments_create_intent', async (job: Job) => {
    const { tenantId, orderId, membershipId, amount, currency, providerKey, idempotencyKey } = job.data;

    // Create DB Intent record
    let intent = await prisma.paymentIntent.findUnique({ where: { idempotencyKey } });
    if (!intent) {
        intent = await prisma.paymentIntent.create({
            data: {
                tenantId,
                orderId,
                membershipId,
                amount,
                currency,
                providerKey,
                idempotencyKey,
            }
        });
    }

    if (intent.status !== 'CREATED') return;

    const provider = getPaymentProvider(providerKey);
    const result = await provider.createPaymentIntent({
        amount,
        currency,
        orderId,
        buyerInfo: {}, // fetch from user
        idempotencyKey
    });

    await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
            providerRef: result.providerRef,
            status: result.status,
            metaJson: result.metaJson
        }
    });

}, { connection: redisConnection as any });

const captureWorker = new Worker('payments_capture', async (job: Job) => {
    const { paymentIntentId } = job.data;
    const intent = await prisma.paymentIntent.findUnique({ where: { id: paymentIntentId } });
    if (!intent || intent.status === 'CAPTURED') return;

    const provider = getPaymentProvider(intent.providerKey);
    // Ideally we query provider status here for capture.
    const result = await provider.capturePayment(intent.providerRef || "");

    if (result.status === 'CAPTURED') {
        await prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: 'CAPTURED', metaJson: result.metaJson }
        });

        // Update Escrow state
        const escrowCase = await prisma.escrowCase.findFirst({
            where: { orderId: intent.orderId }
        });

        if (escrowCase) {
            await prisma.escrowCase.update({
                where: { id: escrowCase.id },
                data: { status: 'FUNDS_HELD', heldAt: new Date() }
            });

            await prisma.escrowEvent.create({
                data: {
                    supplierTenantId: escrowCase.supplierTenantId,
                    escrowCaseId: escrowCase.id,
                    action: EscrowAction.HOLD_CONFIRMED,
                    metaJson: { paymentIntentId: intent.id }
                }
            });

            // OPERATIONAL hold -> Journal Entry!
            if (escrowCase.holdMode === 'OPERATIONAL') {
                await createSettlementJournalEntry({
                    tenantId: escrowCase.supplierTenantId,
                    sourceType: B2BJournalSourceType.ESCROW,
                    sourceId: escrowCase.id,
                    amount: Number(escrowCase.amount),
                    currency: escrowCase.currency,
                    description: `Escrow Hold for Order ${escrowCase.orderId}`,
                    debitAccountCode: "102",  // Bank
                    creditAccountCode: "336"  // Escrow Liability
                });
            }
        }
    }
}, { connection: redisConnection as any });

const webhookInboxWorker = new Worker('inbox_process_payment_webhook', async (job: Job) => {
    const { inboxId } = job.data;
    const inboxRecord = await prisma.integrationInbox.findUnique({ where: { id: inboxId } });
    if (!inboxRecord || inboxRecord.status !== 'PENDING') return;

    const provider = getPaymentProvider(inboxRecord.providerKey);
    // Assume verifyWebhook has run in the web route and mapped the payload structure

    // Example handler ...
    await prisma.integrationInbox.update({
        where: { id: inboxId },
        data: { status: 'PROCESSED', processedAt: new Date() }
    });
}, { connection: redisConnection as any });

export { createIntentWorker, captureWorker, webhookInboxWorker };
