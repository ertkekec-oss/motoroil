import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface PaymentWebhookPayload {
    provider: 'IYZICO' | 'ODEL';
    providerEventId: string;
    providerPaymentId?: string;
    orderId?: string;
    paidAmount?: number | string;
    currency?: string;
    paidStatus: 'success' | 'failed' | string;
    raw: any;
}

export async function processPaymentEvent(payload: PaymentWebhookPayload) {
    let inbox;
    try {
        // 1. Idempotency Check (clean way)
        const existingEvent = await prisma.paymentEventInbox.findUnique({
            where: { providerEventId: payload.providerEventId }
        });

        if (existingEvent) {
            return true;
        }

        // 2. Yaz Idempotency kaydı
        inbox = await prisma.paymentEventInbox.create({
            data: {
                provider: payload.provider,
                providerEventId: payload.providerEventId,
                providerPaymentId: payload.providerPaymentId,
                raw: payload.raw,
                status: 'RECEIVED'
            }
        });
    } catch (e: any) {
        if (e.code === 'P2002') { // Prisma Unique Constraint Violation
            return true; // Webhook idempotent: eger ayni event tekrar geldiyse true don
        }
        throw e;
    }

    try {
        // 2) Processing logic
        if (payload.paidStatus !== 'success') {
            await updateInbox(inbox.id, 'IGNORED', 'Event status not success');
            return true;
        }

        if (!payload.providerPaymentId) {
            throw new Error('Missing provider payment ID in success event');
        }

        const providerPaymentKey = `${payload.provider}:${payload.providerPaymentId}`;

        const payment = await prisma.networkPayment.findUnique({
            where: { providerPaymentKey }
        });

        if (!payment) {
            throw new Error(`NetworkPayment not found for providerPaymentId: ${payload.providerPaymentId}`);
        }

        if (payment.status === 'PAID') {
            await updateInbox(inbox.id, 'PROCESSED', 'Payment already processed previously', payment.id);
            return true;
        }

        // Tutar Dogrulama (MVP Strict)
        const paymentAmount = Number(payment.amount);
        const incomingAmount = Number(payload.paidAmount);

        if (Math.abs(paymentAmount - incomingAmount) > 0.01) {
            throw new Error(`Amount mismatch. Expected ${paymentAmount}, got ${incomingAmount}`);
        }

        // Currency Dogrulama
        if (payload.currency && payload.currency !== payment.currency) {
            throw new Error(`Currency mismatch. Expected ${payment.currency}, got ${payload.currency}`);
        }

        // 3) Transaction ile Odeme Statusunu & Order Statusunu Isaretleme
        let orderAlreadyProcessed = false;
        await prisma.$transaction(async (tx) => {
            await tx.networkPayment.update({
                where: { id: payment.id },
                data: { status: 'PAID' }
            });

            // Sadece order durumu hala PENDING_PAYMENT ise PAID yap.
            const updatedOrder = await tx.networkOrder.updateMany({
                where: {
                    id: payment.networkOrderId,
                    status: 'PENDING_PAYMENT'
                },
                data: { status: 'PAID', paidAt: new Date() }
            });

            if (updatedOrder.count === 0) orderAlreadyProcessed = true;
        });

        if (orderAlreadyProcessed) {
            await updateInbox(inbox.id, 'IGNORED', 'Order already paid or not pending', payment.id);
            return true;
        }

        await updateInbox(inbox.id, 'PROCESSED', undefined, payment.id);
        return true;

    } catch (e: any) {
        // Hata alan islemleri IGNORED degil FAILED statune cekeriz ki Admin Panel takip edilebilsin
        if (inbox) {
            await updateInbox(inbox.id, 'FAILED', e.message);
        }
        return false; // Throw etmek yerine route'un guvenli 200 donmesini saglar
    }
}

async function updateInbox(id: string, status: 'PROCESSED' | 'IGNORED' | 'FAILED', errorMessage?: string, networkPaymentId?: string) {
    await prisma.paymentEventInbox.update({
        where: { id },
        data: {
            status,
            errorMessage: errorMessage || null,
            networkPaymentId: networkPaymentId || undefined,
            processedAt: new Date()
        }
    });
}
