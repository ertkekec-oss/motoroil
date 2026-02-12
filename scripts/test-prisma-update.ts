import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Testing update on staff without session...');
        const admin = await prisma.staff.findUnique({ where: { username: 'admin' } });
        if (!admin) throw new Error('Admin not found');

        // This should NOT throw if my fix in lib/prisma.ts worked
        await prisma.staff.update({
            where: { id: admin.id },
            data: { status: admin.status } // No-op update
        });
        console.log('✅ Update successful without session!');
    } catch (err: any) {
        console.error('❌ Update failed:', err.message);
    }
}

main().finally(() => prisma.$disconnect())
