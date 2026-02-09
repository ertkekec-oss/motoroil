const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCommissions() {
    console.log('--- DEBUGGING COMMISSIONS ---');

    // 1. Check AppSettings
    const settings = await prisma.appSettings.findUnique({
        where: { key: 'salesExpenses' }
    });
    console.log('1. AppSettings (salesExpenses):');
    if (settings) {
        console.log(JSON.stringify(settings.value, null, 2));
    } else {
        console.log('NOT FOUND');
    }

    // 2. Check Recent Expense Transactions
    const expenses = await prisma.transaction.findMany({
        where: {
            type: 'Expense',
            description: { contains: 'Komisyon', mode: 'insensitive' }
        },
        orderBy: { date: 'desc' },
        take: 5
    });

    console.log('\n2. Recent Commission Transactions:');
    if (expenses.length === 0) {
        console.log('No commission expenses found.');
    } else {
        for (const tx of expenses) {
            console.log(`- ID: ${tx.id}, Date: ${tx.date}, Amount: ${tx.amount}, Desc: ${tx.description}, CompanyId: ${tx.companyId}`);

            // Check Linked Journal
            const journal = await prisma.journal.findFirst({
                where: { sourceId: tx.id, sourceType: 'Transaction' }
            });

            if (journal) {
                console.log(`  -> Linked Journal: ${journal.fisNo} (ID: ${journal.id}), Status: ${journal.status}`);
            } else {
                console.log('  -> NO LINKED JOURNAL FOUND!');
            }
        }
    }
}

debugCommissions()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
