
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staffCount = await prisma.staff.count();
    const customerCount = await prisma.customer.count();
    const companies = await prisma.company.findMany({ select: { id: true, name: true, tenantId: true } });

    console.log('Staff Count:', staffCount);
    console.log('Customer Count:', customerCount);
    console.log('Companies:', companies);

    const firstStaff = await prisma.staff.findFirst();
    console.log('First Staff:', JSON.stringify(firstStaff, null, 2));

    const firstCustomer = await prisma.customer.findFirst();
    console.log('First Customer:', JSON.stringify(firstCustomer, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
