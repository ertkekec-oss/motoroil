import { PrismaClient } from '@prisma/client';
const prismaRaw = new PrismaClient();
import { initiatePayment } from '../src/services/payments/init';
import { processPaymentEvent } from '../src/services/payments/processEvent';

async function main() {
    let company = await prismaRaw.company.findFirst();
    if (!company) {
        company = await prismaRaw.company.create({
            data: {
                name: 'Test Company ' + Date.now(),
                type: 'OTHER',
                taxNumber: '1234567890'
            }
        });
    }

    let order = await prismaRaw.networkOrder.create({
        data: {
            buyerCompanyId: company.id,
            sellerCompanyId: company.id,
            subtotalAmount: 100,
            shippingAmount: 0,
            commissionAmount: 0,
            totalAmount: 100,
            currency: 'TRY',
            status: 'PENDING_PAYMENT',
            itemsHash: 'test_hash_' + Date.now(),
            items: []
        }
    });

    console.log('Created order:', order.id);

    console.log('Testing race condition...');
    const result = await Promise.all([
        initiatePayment(order.id, 'DIRECT'),
        initiatePayment(order.id, 'DIRECT')
    ]);

    console.log('Race results:', result);

    const payments = await prismaRaw.networkPayment.findMany({
        where: { networkOrderId: order.id }
    });
    console.log(`There are ${payments.length} payments in the db. (Should be 1)`);

    if (payments.length === 0) { console.error('No payment created!'); process.exit(1); }

    console.log('Testing webhook...');
    const webhookRes1 = await processPaymentEvent({
        provider: 'ODEL',
        providerEventId: 'evt_test_1_' + Date.now(),
        providerPaymentId: payments[0].providerPaymentId || undefined,
        paidStatus: 'success',
        paidAmount: 100,
        currency: 'TRY',
        raw: {}
    });
    console.log('Webhook 1 result:', webhookRes1);

    const webhookRes2 = await processPaymentEvent({
        provider: 'ODEL',
        providerEventId: 'evt_test_1_' + Date.now(),
        providerPaymentId: payments[0].providerPaymentId || undefined,
        paidStatus: 'success',
        paidAmount: 100,
        currency: 'TRY',
        raw: {}
    });
    console.log('Webhook 2 result:', webhookRes2);

    const inbox = await prismaRaw.paymentEventInbox.findMany({
        where: { providerPaymentId: payments[0].providerPaymentId || undefined }
    });
    console.log(`Inbox count: ${inbox.length}`);

    const finalOrder = await prismaRaw.networkOrder.findUnique({ where: { id: order.id } });
    console.log(`Final order status: ${finalOrder?.status}`);

    process.exit(0);
}

main().catch(console.error);
