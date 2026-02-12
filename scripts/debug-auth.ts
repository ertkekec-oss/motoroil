import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const staff = await prisma.staff.findMany();
    console.log('Full Staff List:');
    staff.forEach(s => {
        console.log(`- ID: ${s.id}, Username: ${s.username}, Email: ${s.email}, Role: ${s.role}, Tenant: ${s.tenantId}`);
    });

    const users = await prisma.user.findMany();
    console.log('\nFull Users List:');
    users.forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Tenant: ${u.tenantId}`);
    });
}

main().finally(() => prisma.$disconnect());
