
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany();
    console.log('Staff:', JSON.stringify(staff.map(s => ({ id: s.id, username: s.username, email: s.email, role: s.role, tenantId: s.tenantId })), null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
