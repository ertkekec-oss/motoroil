const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting balance fix...');
    const customers = await prisma.customer.findMany();
    console.log(`Found ${customers.length} customers.`);

    for (const c of customers) {
        const oldBalance = Number(c.balance);
        const newBalance = -oldBalance;
        await prisma.customer.update({
            where: { id: c.id },
            data: { balance: newBalance }
        });
        console.log(`Customer ${c.name}: ${oldBalance} -> ${newBalance}`);
    }

    console.log('Balance fix completed.');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
