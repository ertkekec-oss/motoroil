import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { id: 'PLATFORM_ADMIN' } });
    console.log('PLATFORM_ADMIN Tenant Record:', tenant);

    if (!tenant) {
        console.log('Creating PLATFORM_ADMIN tenant record...');
        await prisma.tenant.create({
            data: {
                id: 'PLATFORM_ADMIN',
                name: 'Periodya Platform',
                ownerEmail: 'admin@kech.tr',
                status: 'ACTIVE',
                setupState: 'COMPLETED'
            }
        });
        console.log('✅ Created.');
    }
}

main().finally(() => prisma.$disconnect())
