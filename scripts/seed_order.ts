import { prisma } from '../src/lib/prisma';
async function main() {
    const o = await prisma.networkOrder.create({
        data: {
            buyerCompanyId: 'buyer2',
            sellerCompanyId: 'seller2',
            subtotalAmount: 100,
            shippingAmount: 0,
            commissionAmount: 0,
            totalAmount: 100,
            currency: 'TRY',
            status: 'PENDING_PAYMENT',
            itemsHash: 'abc',
            items: []
        }
    });
    console.log('ORDER_ID_IS:', o.id);
}
main().catch(console.error).finally(() => process.exit(0));
