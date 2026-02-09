const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany({
        select: { id: true, username: true, role: true, tenantId: true, companyId: true }
    });
    console.log('Staff:', JSON.stringify(staff, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
