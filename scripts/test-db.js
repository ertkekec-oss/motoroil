const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log("LAST 5 USERS:", users.map(u => ({ id: u.id, name: u.name, email: u.email })));
    
    const staffs = await prisma.staff.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log("LAST 5 STAFFS:", staffs.map(s => ({ id: s.id, name: s.name, email: s.email, username: s.username })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
