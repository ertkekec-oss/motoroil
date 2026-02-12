import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const attempts = await prisma.loginAttempt.findMany({
        where: { createdAt: { gte: fifteenMinsAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    console.log('Recent Login Attempts:', JSON.stringify(attempts, null, 2));

    if (attempts.length > 0) {
        // Clear them for testing if user wants to login now
        // await prisma.loginAttempt.deleteMany({ where: { createdAt: { gte: fifteenMinsAgo } } });
        // console.log('✅ Cleared recent login attempts');
    }
}

main().finally(() => prisma.$disconnect())
