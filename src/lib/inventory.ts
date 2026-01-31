import prisma from './prisma';

/**
 * Calculates current inventory value using FIFO (First-In, First-Out)
 * It assumes that items currently in stock are the most recently purchased ones.
 */
export async function calculateInventoryValueFIFO(productId: string, branch: string) {
    try {
        // 1. Get current stock level
        const stock = await prisma.stock.findUnique({
            where: { productId_branch: { productId, branch } }
        });

        if (!stock || stock.quantity <= 0) return 0;

        let remainingQty = stock.quantity;
        let totalValue = 0;

        // 2. Get all 'IN' movements sorted by newest first
        const inMovements = await (prisma as any).stockMovement.findMany({
            where: {
                productId,
                branch,
                quantity: { gt: 0 }
            },
            orderBy: { createdAt: 'desc' }
        });

        for (const move of inMovements) {
            const qtyInThisBatch = Number(move.quantity);
            const priceInThisBatch = Number(move.price);

            if (remainingQty <= qtyInThisBatch) {
                totalValue += remainingQty * priceInThisBatch;
                remainingQty = 0;
                break;
            } else {
                totalValue += qtyInThisBatch * priceInThisBatch;
                remainingQty -= qtyInThisBatch;
            }
        }

        // If we still have remaining qty but no more IN movements, 
        // fallback to the product's default buyPrice for those
        if (remainingQty > 0) {
            const product = await prisma.product.findUnique({ where: { id: productId } });
            totalValue += remainingQty * Number(product?.buyPrice || 0);
        }

        return totalValue;
    } catch (error) {
        console.error('FIFO Calculation Error:', error);
        return 0;
    }
}

/**
 * Record a stock movement
 */
export async function recordMovement(data: {
    productId: string;
    branch: string;
    quantity: number;
    price: number;
    type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER';
    referenceId?: string;
}) {
    return await (prisma as any).stockMovement.create({
        data: {
            productId: data.productId,
            branch: data.branch,
            quantity: data.quantity,
            price: data.price,
            type: data.type,
            referenceId: data.referenceId
        }
    });
}
