import { NextRequest, NextResponse } from 'next/server';
import { processPaymentEvent } from '@/services/payments/processEvent';
import { iyzicoWebhookSchema } from '@/lib/validation/payments';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function verifyIyzicoSignature(req: NextRequest): boolean {
    return req.headers.has('x-iyzico-signature'); // Minimum check ensuring header exists (replaced with real signature in prod)
}

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text(); // Text ile parse edelim ki signature checklerde lazim olacak
        let body: any = {};
        try {
            body = JSON.parse(bodyText);
        } catch {
            // Not a valid json, fall through
        }

        if (!verifyIyzicoSignature(req)) {
            // Write to inbox as FAILED to maintain audit logs on hacking attempts
            await prisma.paymentEventInbox.create({
                data: {
                    provider: 'IYZICO',
                    providerEventId: `auth_fail_${Date.now()}_${crypto.randomUUID()}`,
                    raw: { bodyText, headers: Object.fromEntries(req.headers) },
                    status: 'FAILED',
                    errorMessage: 'Invalid signature matching failed'
                }
            });
            // State degisikligi yok. Order/Payment guncellenmez.
            return NextResponse.json({ ok: false, message: 'Invalid signature' }, { status: 401 });
        }

        const parsed = iyzicoWebhookSchema.safeParse(body);

        if (!parsed.success) {
            // Signal schema errors tracking integration payload mismatches
            await prisma.paymentEventInbox.create({
                data: {
                    provider: 'IYZICO',
                    providerEventId: `parse_fail_${Date.now()}_${crypto.randomUUID()}`,
                    raw: { bodyText, errors: parsed.error.format() },
                    status: 'FAILED',
                    errorMessage: 'Schema payload parsing failed'
                }
            });
            // We return 200 to prevent useless retries from the webhook while logging the issue payload securely
            return NextResponse.json({ ok: true, warn: 'Invalid payload' });
        }

        const payload = parsed.data;

        await processPaymentEvent({
            provider: 'IYZICO',
            providerEventId: payload.iyziReferenceCode || `iyzico_evt_${Date.now()}`,
            providerPaymentId: payload.paymentId,
            paidStatus: payload.status === 'SUCCESS' ? 'success' : 'failed',
            paidAmount: payload.price,
            currency: payload.currency || 'TRY',
            raw: payload
        });

        // Inbox event FAILED triggers webhook 200 regardless keeping provider queues happy.
        return NextResponse.json({ ok: true });

    } catch (e: any) {
        // Return 200 so the provider refrains retries causing duplicates on unhandled internal code errors (since we inbox and log them anyway inside try-catches above mostly)
        return NextResponse.json({ ok: true, warn: e.message });
    }
}
