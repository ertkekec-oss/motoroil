import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@kech.tr';

    // 1. Check User Table
    const user = await prisma.user.findFirst({ where: { email } });

    // 2. Check Staff Table
    const staff = await prisma.staff.findFirst({
        where: { OR: [{ email: email }, { username: email }] }
    });

    // 3. Check Recent Login Attempts
    const attempts = await prisma.loginAttempt.findMany({
        where: { username: email },
        orderBy: { createdAt: 'desc' },
        take: 3
    });

    const report = {
        scanFor: email,
        inUserTable: !!user,
        userId: user?.id,
        userHash: user?.password?.substring(0, 15),
        inStaffTable: !!staff,
        staffId: staff?.id,
        staffHash: staff?.password?.substring(0, 15),
        conflictDetected: !!(user && staff),
        recentAttempts: attempts
    };

    fs.writeFileSync('diagnose-result.json', JSON.stringify(report, null, 2));
    console.log('Diagnostic report saved to diagnose-result.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
