const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const expenses = await prisma.transaction.findMany({
        where: { type: 'Expense', description: { contains: 'Komisyon' } },
        take: 20
    });

    for (const exp of expenses) {
        const journal = await prisma.journal.findFirst({ where: { sourceId: exp.id } });
        console.log(`Expense: ${exp.description}, Amount: ${exp.amount}, Journal: ${journal ? journal.fisNo : 'MISSING'}`);
    }
}

main().finally(() => prisma.$disconnect());
