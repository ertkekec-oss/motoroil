import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.salesInvoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            invoiceNo: true,
            formalUuid: true,
            formalType: true,
            isFormal: true,
            createdAt: true
        }
    });
    console.log(JSON.stringify(invoices, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
