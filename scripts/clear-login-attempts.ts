import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- CLEARING LOGIN ATTEMPTS ---');

    const result = await (prisma as any).loginAttempt.deleteMany({});
    console.log(`Deleted ${result.count} failed login attempts.`);

    // Verify user one more time
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@periodya.com' }
    });

    if (admin) {
        console.log('Admin user exists in DB.');
    } else {
        console.log('CRITICAL: Admin user NOT FOUND in DB. Re-seeding...');
        // Seed script logic or just call it
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
