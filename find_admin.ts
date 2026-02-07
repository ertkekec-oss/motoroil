
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminStaff = await (prisma as any).staff.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    console.log('Admin Staff:', adminStaff);

    const adminUser = await (prisma as any).user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    console.log('Admin User:', adminUser);
}

main().catch(console.error).finally(() => prisma.$disconnect());
