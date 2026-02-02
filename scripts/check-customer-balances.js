const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.findMany({ select: { id: true, name: true, balance: true } });
    console.log('CUSTOMERS:', JSON.stringify(customers, null, 2));

    let totalReceivable = 0;
    let totalPayable = 0;

    customers.forEach(c => {
        const bal = Number(c.balance);
        if (bal > 0) totalReceivable += bal;
        else if (bal < 0) totalPayable += Math.abs(bal);
    });

    console.log('DB Total Receivable (+):', totalReceivable);
    console.log('DB Total Payable (-):', totalPayable);
    console.log('DB Net:', totalReceivable - totalPayable);
}

main().finally(() => prisma.$disconnect());
