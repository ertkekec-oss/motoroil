import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const staff = await prisma.staff.findMany();
    let log = 'Staff List:\n';
    staff.forEach(s => {
        log += `[${s.id}] User: ${s.username} | Email: ${s.email} | Tenant: ${s.tenantId} | Role: ${s.role}\n`;
    });
    fs.writeFileSync('staff_debug_utf8.txt', log, 'utf8');
}

main().finally(() => prisma.$disconnect())
