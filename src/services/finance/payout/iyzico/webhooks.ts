import { PrismaClient } from '@prisma/client';
import { IyzicoProvider } from '../providers/iyzicoProvider';

const prisma = new PrismaClient();
const provider = new IyzicoProvider(); // We use the signature verifier from it

export async function ingestWebhook(signature: string, payloadStr: string, eventObj: any) {
    if (!provider.verifyWebhookSignature(signature, payloadStr)) {
        throw new Error('Invalid signature');
    }

    const externalId = eventObj.iyziEventType + '_' + eventObj.iyziEventTime;

    // Idempotent Ingest
    const created = await prisma.providerWebhookEvent.create({
        data: {
            provider: 'IYZICO',
            externalEventId: externalId,
            eventType: eventObj.iyziEventType,
            payloadJson: eventObj,
        }
    }).catch(e => {
        if (e.code === 'P2002') return null; // already ingested
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
