import { Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/queue/redis';
import { prisma } from '../lib/prisma';
import { releaseEscrowQueue, refundEscrowQueue, executePayoutQueue } from '../services/payments/queue';

// This worker processes Outbox Events periodically
export const outboxDispatcherWorker = new Worker('outbox_dispatcher', async (job: Job) => {
    // Check Kill Switch First!
    const killSwitch = await prisma.b2BSystemConfig.findUnique({ where: { key: 'queuesEnabled' } });
    const isEnabled = killSwitch ? (killSwitch.valueJson as any)?.enabled !== false : true;
    if (!isEnabled) {
        console.log("[Outbox Dispatcher] PAUSED by Kill Switch");
        return;
    }

    const pendingEvents = await prisma.b2BOutboxEvent.findMany({
        where: { status: 'PENDING', retryCount: { lt: 5 } },
        take: 50,
        orderBy: { createdAt: 'asc' }
    });

    for (const event of pendingEvents) {
        try {
            const payload = event.payloadJson as any;

            // Map topic to proper queue
            if (event.topic === 'ESCROW_RELEASE') {
                await releaseEscrowQueue.add('release', payload, { jobId: `ev_${event.id}` });
            } else if (event.topic === 'PAYOUT_EXECUTE') {
                await executePayoutQueue.add('execute', payload, { jobId: `ev_${event.id}` });
            } else if (event.topic === 'ESCROW_REFUND') {
                await refundEscrowQueue.add('refund', payload, { jobId: `ev_${event.id}` });
            }

            await prisma.b2BOutboxEvent.update({
                where: { id: event.id },
                data: { status: 'SENT', sentAt: new Date() }
            });

        } catch (error: any) {
            await prisma.b2BOutboxEvent.update({
                where: { id: event.id },
                data: {
                    retryCount: { increment: 1 },
                    lastError: error.message,
                    status: event.retryCount >= 4 ? 'FAILED' : 'PENDING'
                }
            });
        }
    }
}, { connection: redisConnection as any });
