import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function initiatePayment(orderId: string, requestedMode: 'DIRECT' | 'ESCROW') {
    // 1. Order Fetch
    const order = await prisma.networkOrder.findUnique({
        where: { id: orderId }
    });

    if (!order) throw Object.assign(new Error('Order not found'), { httpCode: 404 });
    if (order.status !== 'PENDING_PAYMENT') {
        throw Object.assign(new Error(`Cannot pay for order in status: ${order.status}`), { httpCode: 400 });
    }

    // 2. Prevent Multiple Initiated Payments for the same Order
    const existingPayment = await prisma.networkPayment.findUnique({
        where: { attemptKey: `${order.id}:INITIATED` }
    });

    if (existingPayment) {
        return {
            paymentId: existingPayment.id,
            checkoutUrl: existingPayment.checkoutUrl,
            mode: existingPayment.mode,
            provider: existingPayment.provider
        };
    }

    // 3. Feature/Plan logic - Mocked
    const isEscrowAllowed = true; // Feature flag mock

    // 4. Provider selection
    let provider: 'IYZICO' | 'ODEL' = 'ODEL';
    let mode: 'DIRECT' | 'ESCROW' = 'DIRECT';

    if (requestedMode === 'ESCROW' && isEscrowAllowed) {
        provider = 'IYZICO';
        mode = 'ESCROW';
    }

    // 5. Create internal NetworkPayment mapping (Status INITIATED)
    const providerPaymentId = `txn_${crypto.randomBytes(16).toString('hex')}`; // Placeholder external reference ID request
    const providerPaymentKey = `${provider}:${providerPaymentId}`;
    const mockCheckoutUrl = `https://mock.checkout.com/pay/${providerPaymentId}`;

    try {
        const payment = await prisma.networkPayment.create({
            data: {
                networkOrderId: order.id,
                provider,
                mode,
                status: 'INITIATED',
                amount: order.totalAmount, // Prisma Decimal
                currency: order.currency,
                providerPaymentId: providerPaymentId, // Normally this comes after SDK request
                providerPaymentKey,
                attemptKey: `${order.id}:INITIATED`,
                checkoutUrl: mockCheckoutUrl,
                rawInit: { requestedMode, provider }
            }
        });

        return {
            paymentId: payment.id,
            checkoutUrl: payment.checkoutUrl,
            mode,
            provider
        };
    } catch (e: any) {
        if (e.code === 'P2002') {
            // Race condition occured, another INITIATED payment was just created
            const racePayment = await prisma.networkPayment.findUnique({
                where: { attemptKey: `${order.id}:INITIATED` }
            });
            if (racePayment) {
                return {
                    paymentId: racePayment.id,
                    checkoutUrl: racePayment.checkoutUrl,
                    mode: racePayment.mode,
                    provider: racePayment.provider
                };
            }
        }
        throw e;
    }
}
