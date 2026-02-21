const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB Check ---');
    try {
        const tenants = await prisma.tenant.findMany();
        console.log('Tenants count:', tenants.length);
        if (tenants.length > 0) {
            console.log('Tenants:', JSON.stringify(tenants, null, 2));
        }

        const users = await prisma.user.findMany();
        console.log('Users count:', users.length);
        if (users.length > 0) {
            console.log('Users:', JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2));
        }

        const staff = await prisma.staff.findMany();
        console.log('Staff count:', staff.length);

    } catch (err) {
        console.error('Error during DB check:', err.message);
    }
}

main().finally(() => prisma.$disconnect());
