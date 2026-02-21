
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const invoices = await prisma.salesInvoice.findMany({
        where: {
            formalUuid: { not: null }
        },
        select: { id: true, invoiceNo: true, formalUuid: true, formalType: true },
        take: 10
    });
    console.log(JSON.stringify(invoices, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
