const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    let out = [];
    const orders = await prisma.order.findMany({
        where: { status: 'İptal Edildi' },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    for (const order of orders) {
        let rawData = order.rawData || {};
        if (typeof rawData === 'string') {
            try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
        }
        out.push(`Order ${order.id}: earnedPoints=${rawData.dynamicEarnedPoints}, usedPoints=${rawData.pointsUsed}, customerId=${order.customerId}`);
        
        const transactions = await prisma.transaction.findMany({
            where: { description: { contains: order.id } }
        });
        
        out.push(` - Has ${transactions.length} transactions, Customer ID from Trx: ${transactions.find(t => t.customerId)?.customerId}`);
        out.push(` - Description of Trx: ${transactions[0]?.description}`);
    }
    fs.writeFileSync('debug-points-clean.log', out.join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
