const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // kech.tr ile staff bul
    const kechStaff = await prisma.staff.findMany({
        where: {
            OR: [
                { email: { contains: 'kech' } },
                { username: { contains: 'kech' } }
            ]
        }
    });
    console.log('kech.tr staff count:', kechStaff.length);
    console.log('kech.tr staff:', JSON.stringify(kechStaff.map(function (s) { return { id: s.id, username: s.username, email: s.email, role: s.role }; }), null, 2));

    // Admin stafflari listele
    const admins = await prisma.staff.findMany({
        where: {
            OR: [
                { role: 'SUPER_ADMIN' },
                { role: 'ADMIN' }
            ]
        },
        select: { id: true, username: true, email: true, role: true }
    });
    console.log('\nAdmin staff:', JSON.stringify(admins, null, 2));
}

main().catch(console.error).finally(function () { return prisma.$disconnect(); });
