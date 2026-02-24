import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany({
        where: { name: { contains: 'ertuğrul', mode: 'insensitive' } },
        select: {
            id: true,
            name: true,
            username: true
        }
    });

    console.log('=== PERSONEL USER LİNK KONTROLÜ ===');
    staff.forEach(s => {
        console.log(`ID: ${s.id}, İsim: ${s.name}, Username: ${s.username}`);
    });
}

main().finally(() => prisma.$disconnect());
