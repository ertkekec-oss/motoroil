import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const admin = await prisma.staff.findUnique({ where: { username: 'admin' } });
    if (admin) {
        console.log(`Common search: Found admin with tenantId: ${admin.tenantId}`);
        const updated = await prisma.staff.update({
            where: { id: admin.id },
            data: { tenantId: 'PLATFORM_ADMIN' }
        });
        console.log(`Updated admin tenantId to: ${updated.tenantId}`);
    } else {
        console.log('Admin not found in Staff table.');
    }

    const all = await prisma.staff.findMany();
    console.log('All Staff (Raw):');
    all.forEach(s => console.log(`${s.id} | ${s.username} | ${s.tenantId}`));
}

main().finally(() => prisma.$disconnect())
