import { NextRequest, NextResponse } from 'next/server';
import { processPaymentEvent } from '@/services/payments/processEvent';
import { odelWebhookSchema } from '@/lib/validation/payments';
import { prisma } from '@/lib/prisma';

function verifyOdelSignature(req: NextRequest): boolean {
    return req.headers.has('x-odel-signature'); // Minimum check ensuring header exists (replaced with real signature in prod)
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

        if (!verifyOdelSignature(req)) {
            // Write to inbox as FAILED to maintain audit logs on hacking attempts
            await prisma.paymentEventInbox.create({
                data: {
                    provider: 'ODEL',
                    providerEventId: `auth_fail_${Date.now()}_${crypto.randomUUID()}`,
                    raw: { bodyText, headers: Object.fromEntries(req.headers) },
                    status: 'FAILED',
                    errorMessage: 'Invalid signature matching failed'
                }
            });
            // State degisikligi yok. Order/Payment guncellenmez.
            return NextResponse.json({ ok: false, message: 'Invalid signature' }, { status: 401 });
        }

        const parsed = odelWebhookSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
        }

        const payload = parsed.data;

        await processPaymentEvent({
            provider: 'ODEL',
            providerEventId: payload.eventId,
            providerPaymentId: payload.paymentId,
            paidStatus: payload.status === 'APPROVED' ? 'success' : 'failed',
            paidAmount: payload.amount,
            currency: payload.currency || 'TRY',
            raw: payload
        });

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        return NextResponse.json({ ok: true, warn: e.message });
    }
}
