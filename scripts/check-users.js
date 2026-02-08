const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.staff.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            branch: true
        }
    });
    console.log('Users in database:', JSON.stringify(users, null, 2));

    const companies = await prisma.company.findMany({
        select: { id: true, name: true }
    });
    console.log('Companies:', JSON.stringify(companies, null, 2));

    await prisma.$disconnect();
}

checkUsers();
