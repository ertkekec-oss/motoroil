const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const idL = 'cmlsmhyap000e8fcnemogl9hn'; // with L
    const id1 = 'cmlsmhyap000e8fcnemog19hn'; // with 1

    const cL = await prisma.company.findUnique({ where: { id: idL } });
    const c1 = await prisma.company.findUnique({ where: { id: id1 } });

    console.log('Company with L:', cL ? cL.name : 'NONE');
    console.log('Company with 1:', c1 ? c1.name : 'NONE');
}

check().catch(console.error).finally(() => prisma.$disconnect());
