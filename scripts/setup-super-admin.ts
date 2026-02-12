import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@kech.tr'
    const username = 'admin'
    const password = await bcrypt.hash('admin1234', 10)

    // Ensure there is a platform admin in Staff Table
    const platformAdmin = await prisma.staff.upsert({
        where: { username: username },
        update: {
            email: email,
            password: password,
            role: 'SUPER_ADMIN',
            tenantId: 'PLATFORM_ADMIN',
            permissions: ['*']
        },
        create: {
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

    console.log('✅ Super Admin created/updated in Staff table:', platformAdmin.username)
}

main().finally(() => prisma.$disconnect())
