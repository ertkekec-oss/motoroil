import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const result = await prisma.loginAttempt.deleteMany({});
    console.log(`✅ Cleared ${result.count} login attempts.`);
}

main().finally(() => prisma.$disconnect())
