import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany({
        where: { deletedAt: null },
        select: {
            id: true,
            name: true,
            username: true,
            role: true,
            permissions: true
        }
    });

    console.log('=== PERSONEL YETKİ LİSTESİ ===');
    staff.forEach(s => {
        console.log(`ID: ${s.id}`);
        console.log(`İsim: ${s.name} (@${s.username})`);
        console.log(`Rol: ${s.role}`);
        console.log(`Yetkiler: ${JSON.stringify(s.permissions)}`);
        console.log('---');
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
