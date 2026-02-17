const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectInvoiceItems() {
    console.log('Inspecting last 5 SalesInvoices items...');
    const invoices = await prisma.salesInvoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    invoices.forEach(inv => {
        console.log(`Invoice: ${inv.invoiceNo}`);
        let items = inv.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.log('  Items is string but invalid JSON');
                return;
            }
        }

        if (Array.isArray(items)) {
            items.forEach((item, idx) => {
                console.log(`  Item ${idx}:`, item);
            });
        } else {
            console.log('  Items:', items);
        }
    });
}

inspectInvoiceItems().finally(() => prisma.$disconnect());
