import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPlatformLedgerEntries({
    from,
    to,
    account,
    cursor,
    take = 50
}: {
    from?: string;
    to?: string;
    account?: string;
    cursor?: string;
    take?: number;
}) {
    const where: Prisma.LedgerEntryWhereInput = {
        tenantId: 'PLATFORM_TENANT_CONST'
    };

    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
    }

    if (account) {
        (where as any).accountType = account;
    }

    const entries = await prisma.ledgerEntry.findMany({
        where,
        take: take + 1, // Fetch +1 to check if there is a next page
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' }
    });

    let nextCursor: string | undefined = undefined;
    if (entries.length > take) {
        const nextItem = entries.pop();
        nextCursor = nextItem?.id;
    }

    return {
        data: entries,
        nextCursor
    };
}
