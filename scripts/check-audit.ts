import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
    const r = await p.marketplaceActionAudit.findMany({
        where: { orderId: { not: undefined } },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(r);
}
main().catch(console.log)
