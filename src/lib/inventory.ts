import prisma from './prisma';

/**
 * Advanced FIFO Inventory Valuation with Batch Processing
 * This function calculates inventory value for multiple products efficiently
 */
export async function calculateBatchInventoryValueFIFO(
    productBranchPairs: Array<{ productId: string; branch: string; quantity: number }>
): Promise<number> {
    try {
        if (productBranchPairs.length === 0) return 0;

        let totalValue = 0;

        // Batch fetch all stock movements for all products
        const productIds = [...new Set(productBranchPairs.map(p => p.productId))];
        const branches = [...new Set(productBranchPairs.map(p => p.branch))];

        const allMovements = await (prisma as any).stockMovement.findMany({
            where: {
                productId: { in: productIds },
                branch: { in: branches },
                quantity: { gt: 0 }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group movements by product and branch
        const movementMap = new Map<string, any[]>();
        for (const movement of allMovements) {
            const key = `${movement.productId}_${movement.branch}`;
            if (!movementMap.has(key)) {
                movementMap.set(key, []);
            }
            movementMap.get(key)!.push(movement);
        }

        // Calculate value for each product-branch pair
        for (const pair of productBranchPairs) {
            const key = `${pair.productId}_${pair.branch}`;
            const movements = movementMap.get(key) || [];

            let remainingQty = pair.quantity;
            let pairValue = 0;

            for (const move of movements) {
                const qtyInBatch = Number(move.quantity);
                const priceInBatch = Number(move.price);

                if (remainingQty <= qtyInBatch) {
                    pairValue += remainingQty * priceInBatch;
                    remainingQty = 0;
                    break;
                } else {
                    pairValue += qtyInBatch * priceInBatch;
                    remainingQty -= qtyInBatch;
                }
            }

            // Fallback to product buyPrice if movements don't cover all quantity
            if (remainingQty > 0) {
                const product = await prisma.product.findUnique({
                    where: { id: pair.productId },
                    select: { buyPrice: true }
                });
                pairValue += remainingQty * Number(product?.buyPrice || 0);
            }

            totalValue += pairValue;
        }

        return totalValue;
    } catch (error) {
        console.error('Batch FIFO Calculation Error:', error);
        return 0;
    }
}

/**
 * Calculates current inventory value using FIFO (First-In, First-Out)
 * Single product version - use calculateBatchInventoryValueFIFO for better performance
 */
export async function calculateInventoryValueFIFO(productId: string, branch: string) {
    try {
        const stock = await prisma.stock.findUnique({
            where: { productId_branch: { productId, branch } }
        });

        if (!stock || stock.quantity <= 0) return 0;

        const result = await calculateBatchInventoryValueFIFO([
            { productId, branch, quantity: stock.quantity }
        ]);

        return result;
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
