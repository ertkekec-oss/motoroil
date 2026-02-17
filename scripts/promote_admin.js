
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.updateMany({
        where: { username: 'admin' },
        data: { role: 'SUPER_ADMIN', tenantId: 'PLATFORM_ADMIN' }
    });
    console.log('Updated staff admin:', staff.count);

    const user = await prisma.user.updateMany({
        where: { email: 'admin@motoroil.com' },
        data: { role: 'SUPER_ADMIN', tenantId: 'PLATFORM_ADMIN' }
    });
    console.log('Updated user admin:', user.count);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
