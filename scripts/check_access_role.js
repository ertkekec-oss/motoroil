const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAccess() {
    const email = 'ertugrul.kekec@periodya.com';
    const user = await prisma.user.findFirst({
        where: { email },
        include: {
            accessibleCompanies: true
        }
    });

    console.log('User Role (DB):', user.role);
    console.log('Access Records:', JSON.stringify(user.accessibleCompanies, null, 2));
}

checkAccess().catch(console.error).finally(() => prisma.$disconnect());
