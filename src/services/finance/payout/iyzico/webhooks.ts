import { PrismaClient } from '@prisma/client';
import { IyzicoProvider } from '../providers/iyzicoProvider';

const prisma = new PrismaClient();
const provider = new IyzicoProvider(); // We use the signature verifier from it

import crypto from 'crypto';

export async function ingestWebhook(signature: string, payloadStr: string, eventObj: any, timestampStr?: string, overrides?: { now?: Date }) {
    const now = overrides?.now || new Date();
    
    // 1) Timestamp
    if (!timestampStr) {
        const err = new Error('Missing timestamp header');
        (err as any).statusCode = 401;
        throw err;
    }
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Math.abs(now.getTime() - timestamp) > 5 * 60000) {
        const err = new Error('Expired timestamp');
        (err as any).statusCode = 401;
        throw err;
    }

    // 2) Signature
    if (!provider.verifyWebhookSignature(signature, payloadStr)) {
        const err = new Error('Invalid signature');
        (err as any).statusCode = 401;
        throw err;
    }

    // 3) Replay Prevention
    const payloadHash = crypto.createHash('sha256').update(payloadStr + timestampStr).digest('hex');
    const externalId = eventObj.iyziEventType + '_' + eventObj.iyziEventTime + '_' + payloadHash;

    const created = await prisma.providerWebhookEvent.create({
        data: {
            provider: 'IYZICO',
            externalEventId: externalId,
            eventType: eventObj.iyziEventType,
            payloadJson: eventObj,
        }
    }).catch(async e => {
        if (e.code === 'P2002') {
             await prisma.financeOpsLog.create({
                  data: {
                       action: 'WEBHOOK_REPLAY_REJECTED',
                       entityType: 'Webhook',
                       severity: 'WARNING',
                       payloadJson: { hash: payloadHash }
                  }
             });
             const err = new Error('Replayed payload');
             (err as any).statusCode = 401;
             throw err;
        }
        throw e;
    });

    return created;
}

export async function processWebhookEvents() {
    const unproc = await prisma.providerWebhookEvent.findMany({
        where: { status: 'RECEIVED' },
        take: 10
    });

    let processedCount = 0;
    for (const evt of unproc) {
        // Optimistic lock
        const locked = await prisma.providerWebhookEvent.updateMany({
            where: { id: evt.id, status: 'RECEIVED' },
            data: { status: 'PROCESSED' }
        });

        if (locked.count === 0) continue;

        const payload: any = evt.payloadJson;

        if (evt.eventType === 'PAYOUT_SUCCEEDED') {
            await prisma.providerPayout.updateMany({
                where: { providerPayoutId: payload.providerPayoutId },
                data: { status: 'SUCCEEDED' },
            });
            // Finalize job enqueue would happen here (or directly call ledgerFinalize logic if queued framework not present)
        } else if (evt.eventType === 'PAYOUT_FAILED') {
            await prisma.providerPayout.updateMany({
                where: { providerPayoutId: payload.providerPayoutId },
                data: { status: 'FAILED' }
            });
        }
        processedCount++;
    }

    return { processedCount };
}
