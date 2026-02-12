import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const result = await prisma.user.deleteMany({
        where: { email: 'admin@kech.tr' }
    });
    console.log(`Deleted ${result.count} users with email admin@kech.tr`);
}

main().finally(() => prisma.$disconnect())
