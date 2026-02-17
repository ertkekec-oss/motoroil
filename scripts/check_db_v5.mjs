
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const accountCode = '120.03';
    const lines = await (prisma as any).journalLine.findMany({
        where: { accountCode },
        take: 5
    });
    console.log(`Lines for ${accountCode}:`, JSON.stringify(lines, null, 2));

    const stats = await (prisma as any).journalLine.aggregate({
        where: { accountCode },
        _sum: { debit: true, credit: true },
        _count: { id: true }
    });
    console.log(`Stats for ${accountCode}:`, stats);
}

main().catch(console.error).finally(() => prisma.$disconnect());
