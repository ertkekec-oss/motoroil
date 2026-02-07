
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIsolation() {
    const models = [
        'customer', 'product', 'transaction', 'kasa', 'salesInvoice', 'purchaseInvoice',
        'supplier', 'order', 'serviceRecord', 'quote', 'paymentPlan'
    ];

    console.log('--- ISOLATION AUDIT ---');
    for (const model of models) {
        try {
            const count = await prisma[model].count({
                where: { companyId: null }
            });
            console.log(`${model}: ${count} records without companyId`);
        } catch (err) {
            console.log(`${model}: Table or column not found or error occurred`);
        }
    }
    await prisma.$disconnect();
}

checkIsolation();
