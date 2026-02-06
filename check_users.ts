
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 5
    });
    console.log('Users:', users.map(u => ({ email: u.email, role: u.role })));

    const tenants = await prisma.tenant.findMany({
        take: 5
    });
    console.log('Tenants:', tenants.map(t => ({ name: t.name, id: t.id })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
