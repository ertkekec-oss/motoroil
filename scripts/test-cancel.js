const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Creating a dummy order...");
    const customer = await prisma.customer.findFirst({ where: { deletedAt: null } });
    const user = await prisma.user.findFirst();

    const order = await prisma.order.create({
        data: {
            marketplace: 'POS',
            marketplaceId: 'LOCAL',
            orderNumber: 'TEST-123',
            companyId: customer.companyId,
            staffId: user.id,
            customerName: customer.name,
            totalAmount: 100,
            status: 'Tamamlandı',
            rawData: { dynamicEarnedPoints: 50 }
        }
    });

    const trx = await prisma.transaction.create({
        data: {
            companyId: customer.companyId,
            description: `Test | REF:${order.id}`,
            amount: 100,
            type: 'Sales',
            customerId: customer.id
        }
    });

    await prisma.customer.update({
        where: { id: customer.id },
        data: { points: { increment: 50 } }
    });
    
    const before = await prisma.customer.findUnique({ where: { id: customer.id } });
    console.log(`Pre-Cancel points: ${before.points}`);

    // Call DELETE API programmatically using raw Prisma to simulate it exactly
    await prisma.$transaction(async (tx) => {
        const transactions = await tx.transaction.findMany({ where: { description: { contains: order.id } } });
        for (const t of transactions) {
            await tx.transaction.update({ where: { id: t.id }, data: { deletedAt: new Date() } });
        }
        
        const customerId = order.customerId || transactions.find((tr) => tr.customerId)?.customerId;
        let rawData = order.rawData || {};
        if (typeof rawData === 'string') rawData = JSON.parse(rawData);

        if (customerId) {
            const earnedPoints = Number(rawData.dynamicEarnedPoints || 0);
            const netPointsToRevert = earnedPoints;
            console.log(`Decreasing points by: ${netPointsToRevert} for ${customerId}`);
            if (netPointsToRevert !== 0) {
                await tx.customer.update({
                    where: { id: customerId },
                    data: { points: { decrement: netPointsToRevert } }
                });
            }
        }
        await tx.order.update({ where: { id: order.id }, data: { status: 'İptal Edildi' } });
    });

    const after = await prisma.customer.findUnique({ where: { id: customer.id } });
    console.log(`Post-Cancel points: ${after.points}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
