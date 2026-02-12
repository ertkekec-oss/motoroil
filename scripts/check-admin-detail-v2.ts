import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    let output = '';
    const staff = await prisma.staff.findFirst({
        where: { OR: [{ username: 'admin' }, { email: 'admin@kech.tr' }] }
    });
    output += 'Staff Admin Detail:\n';
    if (staff) {
        output += `- ID: ${staff.id}\n`;
        output += `- Username: ${staff.username}\n`;
        output += `- Email: ${staff.email}\n`;
        output += `- Has Password: ${!!staff.password}\n`;
        output += `- Password starts with $2: ${staff.password?.startsWith('$2')}\n`;
        output += `- Password Value: ${staff.password}\n`;
    } else {
        output += 'NOT FOUND in Staff\n';
    }

    const user = await prisma.user.findFirst({
        where: { email: 'admin@kech.tr' }
    });
    output += '\nUser Admin Detail:\n';
    if (user) {
        output += `- ID: ${user.id}\n`;
        output += `- Email: ${user.email}\n`;
        output += `- Has Password: ${!!user.password}\n`;
    } else {
        output += 'NOT FOUND in User\n';
    }

    fs.writeFileSync('admin_debug_utf8.txt', output, 'utf8');
}

main().finally(() => prisma.$disconnect())
