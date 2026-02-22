import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const staff = await prisma.staff.findMany({
        where: { deletedAt: null },
        select: {
            id: true,
            name: true,
            tenantId: true,
            companyId: true
        }
    });

    console.log('=== PERSONEL TENANT LİSTESİ ===');
    staff.forEach(s => {
        console.log(`ID: ${s.id}, İsim: ${s.name}, Tenant: ${s.tenantId}, Company: ${s.companyId}`);
    });
}

main().finally(() => prisma.$disconnect());
