
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const tenantCount = await prisma.tenant.count();
        const companyCount = await prisma.company.count();
        const userCount = await prisma.user.count();
        const supplierCount = await prisma.supplier.count();
        const company = await prisma.company.findFirst();

        console.log('Database Status:');
        console.log('- Tenants:', tenantCount);
        console.log('- Companies:', companyCount);
        console.log('- Users:', userCount);
        console.log('- Suppliers:', supplierCount);
        console.log('- First Company ID:', company?.id);

        const users = await prisma.user.findMany({ select: { email: true, role: true, id: true } });
        console.log('- Users List:', users);

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
