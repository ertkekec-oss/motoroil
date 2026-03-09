import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}

async function main() {
    console.log('=== PERIODYA BILLING & PAYMENT INFRASTRUCTURE TESTS ===\n');

    try {
        // 1. Setup Payment Gateway
        const existingGateway = await prisma.paymentGateway.findUnique({
            where: { provider: 'IYZICO' }
        });

        if (!existingGateway) {
            await prisma.paymentGateway.create({
                data: {
                    provider: 'IYZICO',
                    isActive: true,
                    isTestMode: true,
                    supportedTypes: ['SAAS', 'SMS', 'EINVOICE']
                }
            });
            console.log('[OK] Setup Iyzico payment gateway.');
        } else {
            console.log('[SKIP] Iyzico gateway already configured.');
        }

        // 2. Setup Billing Products
        const existingProducts = await prisma.billingProduct.findMany();
        if (existingProducts.length === 0) {
            await prisma.billingProduct.createMany({
                data: [
                    { type: 'SAAS', name: 'Enterprise Plan', price: 999.00, creditAmount: 0 },
                    { type: 'SMS', name: '500 SMS Package', price: 99.00, creditAmount: 500 },
                    { type: 'EINVOICE', name: '1000 E-Invoice Credits', price: 199.00, creditAmount: 1000 }
                ]
            });
            console.log('[OK] Inserted 3 Billing Products: SAAS, SMS, EINVOICE.');
        } else {
            console.log(`[SKIP] Existent billing products found (${existingProducts.length}).`);
        }

        const products = await prisma.billingProduct.findMany();

        // 3. Find a Tenant to test
        const tenant = await prisma.user.findFirst({
            where: { tenantId: { not: 'PLATFORM_ADMIN' } }
        });

        if (!tenant || !tenant.tenantId) {
            console.warn('[SKIP] No valid tenant to test Billing checkout on.');
            return;
        }

        const tenantId = tenant.tenantId;
        console.log(`\nTesting Checkout for Tenant ID: ${tenantId}`);

        // Ensure TenantCredit model exists
        let credits = await prisma.tenantCredit.findUnique({ where: { tenantId } });
        if (!credits) {
            credits = await prisma.tenantCredit.create({ data: { tenantId } });
        }

        const initialSmsCredits = credits.smsCredits;
        const initialEinvoiceCredits = credits.einvoiceCredits;

        console.log(`[INFO] Current SMS Credits: ${initialSmsCredits}, E-Invoice Credits: ${initialEinvoiceCredits}`);

        // 4. Simulate Checkout
        console.log('\n[TEST 1] Creating Pending Checkout Transaction...');
        const externalRef = `TEST-ORDER-${Date.now()}`;

        const smsProduct = products.find(p => p.type === 'SMS')!;
        const invoiceProduct = products.find(p => p.type === 'EINVOICE')!;

        const createdTransaction = await prisma.paymentTransaction.create({
            data: {
                tenantId,
                gatewayProvider: 'IYZICO',
                productType: 'SMS',
                productId: smsProduct.id,
                amount: smsProduct.price,
                currency: 'TRY',
                status: 'PENDING',
                externalReference: externalRef
            }
        });

        console.log(`[OK] Created Payment Transaction (ID: ${createdTransaction.id})`);

        // 5. Simulate Webhook and Idempotency
        console.log('\n[TEST 2] Processing Gateway Webhook (Credit Allocation)...');

        // Simulate successful payment callback
        await processWebhook(externalRef, 'SUCCESS');

        // Refetch credits
        const updatedCredits = await prisma.tenantCredit.findUnique({ where: { tenantId } });
        console.log(`[RESULT] New SMS Credits: ${updatedCredits!.smsCredits} | Diff: ${updatedCredits!.smsCredits - initialSmsCredits}`);

        if (updatedCredits!.smsCredits - initialSmsCredits !== smsProduct.creditAmount) {
            throw new Error('Credit allocation failed to grant the correct amount.');
        }

        console.log('[OK] Credit allocation successfully processed based on product payload.');

        // 6. Test Idempotency (duplicate webhook call)
        console.log('\n[TEST 3] Testing Idempotent Duplicate Webhook...');
        const duplicateResult = await processWebhook(externalRef, 'SUCCESS');
        if (duplicateResult.processed === 0) {
            console.log('[OK] Duplicate webhook ignored safely due to idempotency.');
        } else {
            throw new Error('Idempotency failure! Webhook double-processed.');
        }

        console.log('\n=== PERIODYA BILLING & PAYMENT INFRASTRUCTURE TESTS PASSED ===');

    } catch (e: any) {
        console.error('\n[ERROR] Test Failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function processWebhook(externalReference: string, status: string) {
    const transactions = await prisma.paymentTransaction.findMany({
        where: { externalReference, gatewayProvider: 'IYZICO' }
    });

    const pendingTransactions = transactions.filter(t => t.status === 'PENDING');

    if (pendingTransactions.length === 0) {
        return { processed: 0 };
    }

    // Update successful transactions and allocate credits
    for (const pt of pendingTransactions) {
        await prisma.paymentTransaction.update({
            where: { id: pt.id },
            data: {
                status: status === 'SUCCESS' ? 'PAID' : 'FAILED',
                updatedAt: new Date()
            }
        });

        if (status === 'SUCCESS') {
            const product = await prisma.billingProduct.findUnique({
                where: { id: pt.productId }
            });

            if (product?.type === 'SMS') {
                await prisma.tenantCredit.update({
                    where: { tenantId: pt.tenantId },
                    data: { smsCredits: { increment: product.creditAmount } }
                });
            } else if (product?.type === 'EINVOICE') {
                await prisma.tenantCredit.update({
                    where: { tenantId: pt.tenantId },
                    data: { einvoiceCredits: { increment: product.creditAmount } }
                });
            }
        }
    }
    return { processed: pendingTransactions.length };
}

main();
