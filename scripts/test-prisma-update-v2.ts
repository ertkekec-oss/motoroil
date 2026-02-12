import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    let log = 'Testing update on staff without session...\n';
    try {
        const admin = await prisma.staff.findUnique({ where: { username: 'admin' } });
        if (!admin) throw new Error('Admin not found');

        await prisma.staff.update({
            where: { id: admin.id },
            data: { status: admin.status }
        });
        log += '✅ Update successful without session!\n';
    } catch (err: any) {
        log += `❌ Update failed: ${err.message}\n`;
    }
    fs.writeFileSync('test_result_utf8.txt', log, 'utf8');
}

main().finally(() => prisma.$disconnect())
