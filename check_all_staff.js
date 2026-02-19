const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const allStaff = await prisma.staff.findMany();
    const match = allStaff.find(s => s.email?.toLowerCase().trim() === email || s.username?.toLowerCase().trim() === email);

    if (match) {
        console.log('STAFF MATCH FOUND:');
        console.log(match);
    } else {
        console.log('NO STAFF MATCH');
    }
}

main().finally(() => prisma.$disconnect());
