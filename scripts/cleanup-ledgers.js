const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const orderTy = await prisma.order.findFirst({ where: { orderNumber: '11069830379', marketplace: 'trendyol' } });
        if (orderTy) {
             const res1 = await prisma.marketplaceTransactionLedger.deleteMany({ where: { orderId: orderTy.id } });
             console.log("Deleted TY ledgers:", res1.count);
        }

        const orderHb = await prisma.order.findFirst({ where: { orderNumber: '4281248337', marketplace: 'hepsiburada' } });
        if (orderHb) {
             const res2 = await prisma.marketplaceTransactionLedger.deleteMany({ where: { orderId: orderHb.id } });
             console.log("Deleted HB ledgers:", res2.count);
        }
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
