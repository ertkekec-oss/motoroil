const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const customer = await prisma.customer.findFirst({ where: { deletedAt: null } });
    console.log(`Initial Points: ${customer.points}`);
    
    const finalTotal = 1500;
    const dynamicEarnedPoints = 1500;
    
    // Use an existing valid user
    const user = await prisma.user.findFirst();

    const order = await prisma.order.create({
        data: {
            marketplace: 'POS',
            marketplaceId: 'LOCAL',
            orderNumber: 'POS-TEST-' + Date.now(),
            companyId: customer.companyId,
            staffId: user.id || '123',
            customerName: customer.name,
            totalAmount: finalTotal,
            currency: 'TRY',
            status: 'Tamamlandı',
            items: [],
            orderDate: new Date(),
            rawData: { dynamicEarnedPoints }
        }
    });

    const trx = await prisma.transaction.create({
        data: {
            companyId: customer.companyId,
            type: 'Sales',
            amount: finalTotal,
            description: `POS Satışı (Nakit) - test | REF:${order.id}`,
            kasaId: (await prisma.kasa.findFirst({ where: { companyId: customer.companyId }})).id,
            customerId: customer.id,
            branch: 'Merkez',
            date: new Date()
        }
    });

    await prisma.customer.update({
        where: { id: customer.id },
        data: { points: { increment: dynamicEarnedPoints } }
    });

    const midCust = await prisma.customer.findUnique({ where: { id: customer.id } });
    console.log(`Points after order created: ${midCust.points}`);

    // Call DELETE API programmatically using raw Prisma to simulate it exactly
    await prisma.$transaction(async (tx) => {
        const transactions = await tx.transaction.findMany({ where: { description: { contains: order.id } } });
        for (const t of transactions) {
            await tx.transaction.update({ where: { id: t.id }, data: { deletedAt: new Date() } });
        }
        
        let customerId;
        try {
            // Because order.customerId doesn't exist, this throws/is undefined in ts, but in JS it's just undefined
            customerId = order.customerId || transactions.find((tr) => tr.customerId)?.customerId;
        } catch(e) {
            customerId = transactions.find((tr) => tr.customerId)?.customerId;
        }
        
        let rawData = order.rawData || {};
        if (typeof rawData === 'string') rawData = JSON.parse(rawData);

        if (customerId) {
            const earnedPoints = Number(rawData.dynamicEarnedPoints || 0);
            if (earnedPoints !== 0) {
                console.log(`Decrementing points by ${earnedPoints} for ${customerId}`);
                await tx.customer.update({
                    where: { id: customerId },
                    data: { points: { decrement: earnedPoints } }
                });
            }
        }
        await tx.order.update({ where: { id: order.id }, data: { status: 'İptal Edildi' } });
    });

    const finalCust = await prisma.customer.findUnique({ where: { id: customer.id } });
    console.log(`Final Points after order canceled: ${finalCust.points}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
