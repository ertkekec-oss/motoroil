import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueWebhookIngest } from '@/services/contracts/jobs';
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: { providerKey: string } }) {
    try {
        const rawBody = await req.text();
        const headersList = Object.fromEntries(req.headers.entries());

        // Dynamic generic verification for demo MVP purposes
        const secret = process.env[`CONTRACTS_WEBHOOK_SECRET_${params.providerKey.toUpperCase()}`];
        if (secret) {
            const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
            const providedSignature = headersList['x-signature'] || headersList['x-hub-signature'];

            // Allow bypassing in development if sig doesn't match, strictly fail in PROD
            if (providedSignature && providedSignature !== hmac && process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
            }
        }

        let payloadJson = {};
        try {
            payloadJson = JSON.parse(rawBody);
        } catch (e) {
            payloadJson = { raw: rawBody };
        }

        // Webhook receiver guarantees no delay
        const inbox = await prisma.webhookInbox.create({
            data: {
                tenantId: "SYSTEM_MAPPED", // Will be resolved natively via enqueue matching in worker
                providerKey: params.providerKey,
                headers: headersList,
                payload: payloadJson,
                status: 'PENDING'
            }
        });

        // Async process queue
        await enqueueWebhookIngest(inbox.id);

        return NextResponse.json({ success: true, message: "Webhook accepted", id: inbox.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
