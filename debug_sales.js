const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecent() {
    console.log('--- RECENT ORDERS ---');
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.table(orders.map(o => ({
        id: o.id,
        no: o.orderNumber,
        amt: o.totalAmount,
        customer: o.customerName,
        branch: o.branch,
        createdAt: o.createdAt
    })));

    console.log('\n--- RECENT TRANSACTIONS ---');
    const transactions = await prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.table(transactions.map(t => ({
        id: t.id,
        type: t.type,
        amt: t.amount,
        desc: t.description.substring(0, 50),
        branch: t.branch,
        createdAt: t.createdAt
    })));

    console.log('\n--- RECENT JOURNALS ---');
    const journals = await prisma.journal.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { account: true } } }
    });
    if (journals) {
        console.log(`Journal: ${journals.fisNo} - ${journals.description} (Date: ${journals.date})`);
        journals.items.forEach(item => {
            console.log(`  ${item.account.code} - ${item.account.name}: ${item.debt > 0 ? 'B:' + item.debt : 'A:' + item.credit}`);
        });
    }

    console.log('\n--- KEKEC CUSTOMER ---');
    const customer = await prisma.customer.findFirst({
        where: { name: { contains: 'kekeç', mode: 'insensitive' } }
    });
    if (customer) {
        console.log(`Customer: ${customer.name}, ID: ${customer.id}, Balance: ${customer.balance}`);
    } else {
        console.log('Customer kekeç not found');
    }
}

checkRecent().catch(console.error).finally(() => prisma.$disconnect());
