import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/services/payments/providers';
import { processPaymentWebhookQueue } from '@/services/payments/queue';

export async function POST(req: Request, { params }: { params: Promise<{ providerKey: string }> }) {
    try {
        const { providerKey } = await params;
        const provider = getPaymentProvider(providerKey);

        const rawBody = await req.arrayBuffer();
        const headers: Record<string, string> = {};
        req.headers.forEach((val, key) => { headers[key] = val; });

        // Verify authenticity and parse payload
        const { valid, eventType, providerEventId, payload } = await provider.verifyWebhook(headers, Buffer.from(rawBody));

        if (!valid || !providerEventId) {
            return NextResponse.json({ error: "Invalid signature or payload" }, { status: 400 });
        }

        // The endpoint is likely public or shared per provider, requiring extraction of tenantId.
        // E.g. provider sends `custom_id` -> map to tenantId if needed,
        // For simplicity, we assume one platform-level account or tenantId can be inferred from payment intention.
        let tenantId = "PLATFORM_TENANT";

        if (payload?.paymentIntentId) {
            const intent = await prisma.paymentIntent.findUnique({
                where: { id: payload.paymentIntentId }
            });
            if (intent) tenantId = intent.tenantId;
        }

        // Inbox deduplication (idempotency by providerEventId)
        let inboxRecord = await prisma.integrationInbox.findUnique({
            where: { providerEventId }
        });

        if (!inboxRecord) {
            inboxRecord = await prisma.integrationInbox.create({
                data: {
                    tenantId,
                    providerKey,
                    eventType: eventType || "UNKNOWN",
                    providerEventId,
                    status: 'PENDING',
                    // Payload usually saved to fileblob/S3, here short json string via meta or separate parsing.
                }
            });

            await processPaymentWebhookQueue.add('inbox', { inboxId: inboxRecord.id }, {
                jobId: `inbox_${inboxRecord.id}`,
                attempts: 3
            });
        }

        return NextResponse.json({ success: true, deduplicated: !!inboxRecord });
    } catch (e: any) {
        console.error("Webhook error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
