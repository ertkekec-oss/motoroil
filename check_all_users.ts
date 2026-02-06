
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STAFF ---');
    const staff = await (prisma as any).staff.findMany({ select: { id: true, username: true, role: true } });
    console.log(JSON.stringify(staff, null, 2));

    console.log('--- USERS ---');
    const users = await (prisma as any).user.findMany({ select: { id: true, email: true, role: true, tenantId: true } });
    console.log(JSON.stringify(users, null, 2));

    console.log('--- TENANTS ---');
    const tenants = await (prisma as any).tenant.findMany({ select: { id: true, name: true } });
    console.log(JSON.stringify(tenants, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
