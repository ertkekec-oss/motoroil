import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@periodya.com'
    const username = 'admin'
    const password = await bcrypt.hash('admin1234', 10)

    // 1. Delete existing one if any to be sure
    try {
        await prisma.staff.delete({ where: { username: username } });
        console.log('Deleted existing "admin" staff');
    } catch (e) { }

    // 2. Create fresh platform admin
    const platformAdmin = await prisma.staff.create({
        data: {
            username: username,
            email: email,
            password: password,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            tenantId: 'PLATFORM_ADMIN',
            status: 'Aktif',
            permissions: ['*']
        }
    })

    console.log('✅ Fresh Super Admin created:');
    console.log(`- Username: ${platformAdmin.username}`);
    console.log(`- Role: ${platformAdmin.role}`);
    console.log(`- Tenant: ${platformAdmin.tenantId}`);
}

main().finally(() => prisma.$disconnect())
