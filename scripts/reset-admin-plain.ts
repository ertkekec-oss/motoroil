import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@periodya.com'
    const username = 'admin'
    const password = 'admin123' // Plain text for auto-migration check

    // Delete existing admin records from staff to clear any junk
    await prisma.staff.deleteMany({
        where: {
            OR: [
                { username: username },
                { email: email }
            ]
        }
    });

    // Create fresh Platform Admin
    const platformAdmin = await prisma.staff.create({
        data: {
            username: username,
            email: email,
            password: password, // Plain text trigger
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            tenantId: 'PLATFORM_ADMIN',
            status: 'Aktif',
            permissions: ['*'],
            branch: 'Merkez'
        }
    })

    console.log('✅ Fresh Super Admin created with PLAIN TEXT password (will auto-hash on first login)');
    console.log(`- Username: ${platformAdmin.username}`);
    console.log(`- Email: ${platformAdmin.email}`);
    console.log(`- Role: ${platformAdmin.role}`);
    console.log(`- Tenant: ${platformAdmin.tenantId}`);
}

main().finally(() => prisma.$disconnect())
