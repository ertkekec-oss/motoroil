const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Starting test..:");
    const invoice = await prisma.salesInvoice.findFirst({
        where: { isFormal: true, status: { not: 'İptal Edildi' }, orderId: { not: null } },
        orderBy: { createdAt: 'desc' }
    });

    if (!invoice) {
        console.log("No POS-bound invoices found to cancel.");
        return;
    }

    console.log("Found POS-bound Invoice:", invoice.id, invoice.invoiceNo, "orderId:", invoice.orderId);
    
    // Simulate transaction
    try {
        await prisma.$transaction(async (tx) => {
            console.log("Updating invoice status...");
            await tx.salesInvoice.update({
                where: { id: invoice.id },
                data: {
                    status: 'İptal Edildi',
                    deletedAt: new Date()
                }
            });

            const order = await tx.order.findUnique({ where: { id: invoice.orderId } });
            console.log("Order fetched:", order?.id);
            if (!order) throw new Error("Order not found");

             const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
             const targetBranch = order.branch || 'Merkez';
             if (Array.isArray(orderItems)) {
                 for (const item of orderItems) {
                     if (item.productId) {
                         const qty = Number(item.qty || item.quantity || 1);
                         await tx.stock.upsert({
                             where: { productId_branch: { productId: String(item.productId), branch: targetBranch } },
                             update: { quantity: { increment: qty } },
                             create: { productId: String(item.productId), branch: targetBranch, quantity: qty }
                         });
                         // Create stockMovement
                     }
                 }
             }
             
             const transactions = await tx.transaction.findMany({
                 where: { description: { contains: `REF:${order.id}` } }
             });
             console.log("Transactions found:", transactions.length);
             
             for (const t of transactions) {
                 if (t.type === 'Sales' || t.type === 'Collection') {
                     // Check if 'balanceToCustomer'
                     console.log("Processing TRX:", t.id, t.type, "amount:", t.amount);
                 }
                 await tx.transaction.update({
                     where: { id: t.id },
                     data: { deletedAt: new Date() }
                 });
             }

            // Revert changes at the end to keep db clean
            throw new Error("Simulated Rollback");
        });
    } catch(e) {
        if (e.message === "Simulated Rollback") {
            console.log("Transaction successfully executed logic and rolled back.");
        } else {
            console.error("Trans error:", e);
        }
    }
}

run().then(() => prisma.$disconnect());
