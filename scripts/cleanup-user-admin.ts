import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const result = await prisma.user.deleteMany({
        where: { email: 'admin@periodya.com' }
    });
    console.log(`Deleted ${result.count} users with email admin@periodya.com`);
}

main().finally(() => prisma.$disconnect())
