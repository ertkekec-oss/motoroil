
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany();
    console.log('Total Tenants:', tenants.length);
    const users = await prisma.user.findMany();
    console.log('Total Users:', users.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
