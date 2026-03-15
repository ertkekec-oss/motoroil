const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fixing points for Cancelled POS Orders...");
    
    // Find all cancelled orders
    const orders = await prisma.order.findMany({
        where: { status: 'İptal Edildi' }
    });

    let fixedCount = 0;
    for (const order of orders) {
        let rawData = order.rawData || {};
        if (typeof rawData === 'string') {
            try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
        }
        
        const earnedPoints = Number(rawData.dynamicEarnedPoints || 0);
        const usedPoints = Number(rawData.pointsUsed || 0);
        const netPointsToRevert = earnedPoints - usedPoints;

        if (netPointsToRevert > 0) {
            // Check if this order has a transaction indicating the customer
            const transactions = await prisma.transaction.findMany({
                where: { description: { contains: order.id } }
            });
            
            const customerId = transactions.find((tr) => tr.customerId)?.customerId;
            if (customerId) {
                // To be safe, let's just ensure we only revert points if the user actually has them.
                // Or maybe we can just decrement them if we trust the bug tracking.
                // We know these 4 orders (cmmsc7, cmmrps, cmmrpp, cmmrpne) failed to revert.
                // Wait, if an order was recently canceled AFTER the code was fixed, it would already have been reverted!
                // How do we know if it was ALREADY reverted?
                // Unfortunately, the audit log or point history isn't perfectly traceable inside Order.
                // But the user ONLY reported THIS issue recently.
                
                // Let's check if the specific orders mentioned in the log are still not reverted
                const buggyDrafts = [
                    'cmmsc7z2q0002b2stv5wy8mc6',
                    'cmmrpsucu0002q642f7x7psm5',
                    'cmmrppmh50002u0ik6phkn2xo',
                    'cmmrpneay0002660pl6f0ve5h'
                ];
                
                // If it's one of the known duplicate orders from the screenshot's customer, we definitely revert it.
                if (buggyDrafts.includes(order.id) || order.createdAt < new Date('2026-03-16T00:00:00Z')) {
                   // let's do a safe decrement if they still have the points
                   const customer = await prisma.customer.findUnique({ where: { id: customerId } });
                   if (customer && customer.points >= netPointsToRevert && buggyDrafts.includes(order.id)) {
                       console.log(`Reverting ${netPointsToRevert} points for ${customer.name} (Order: ${order.id})`);
                       await prisma.customer.update({
                           where: { id: customerId },
                           data: { points: { decrement: netPointsToRevert } }
                       });
                       fixedCount++;
                   }
                }
            }
        }
    }
    
    console.log(`Fixed ${fixedCount} old orders that failed to revert points.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
