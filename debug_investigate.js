const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Checking Product...');
    const product = await prisma.product.findFirst({
        where: { name: { contains: 'cherry 16', mode: 'insensitive' } }
    });
    console.log('Product:', product);

    console.log('\nChecking Today Journals...');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const journals = await prisma.journal.findMany({
        where: { createdAt: { gte: startOfDay } }, // Check by createdAt to be sure
        include: { items: { include: { account: true } } }
    });

    console.log(`Found ${journals.length} journals.`);
    journals.forEach(j => {
        console.log(`\nID: ${j.id}, No: ${j.fisNo}, Desc: ${j.description}, Amount: ${j.totalDebt}`);
        j.items.forEach(i => {
            console.log(`  ${i.type} -> ${i.account.code} (${i.account.name}): ${i.type === 'Borç' ? i.debt : i.credit}`);
        });
    });
}

check().catch(console.error).finally(() => prisma.$disconnect());
