const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const user = await prisma.user.findUnique({
        where: { email: email },
        include: { tenant: true }
    });

    if (user) {
        console.log('USER FOUND:');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`TenantID: ${user.tenantId}`);
        console.log(`Tenant Name: ${user.tenant?.name}`);
        console.log(`Password Hash starts with: ${user.password.substring(0, 10)}...`);
    } else {
        console.log('USER NOT FOUND');
    }
}

main().finally(() => prisma.$disconnect());
