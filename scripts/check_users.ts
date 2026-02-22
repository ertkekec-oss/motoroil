import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { name: { contains: 'ertuğrul', mode: 'insensitive' } },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true
        }
    });

    console.log('=== KULLANICI LİSTESİ ===');
    users.forEach(u => {
        console.log(`ID: ${u.id}, İsim: ${u.name}, Email: ${u.email}, Rol: ${u.role}, Yetkiler: ${JSON.stringify(u.permissions)}`);
    });
}

main().finally(() => prisma.$disconnect());
