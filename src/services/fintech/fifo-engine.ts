import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class FIFOEngine {
    /**
     * Records new stock layers
     */
    static async addLayer(tx: any, data: { companyId: string, productId: string, eventId: string, quantity: number, unitCost: number, branch?: string }) {
        return await tx.inventoryLayer.create({
            data: {
                companyId: data.companyId,
                productId: data.productId,
                sourceEventId: data.eventId,
                quantityInitial: data.quantity,
                quantityRemaining: data.quantity,
                unitCost: data.unitCost,
                branch: data.branch || 'Merkez'
            }
        });
    }

    /**
     * Consumes stock layers using FIFO
     */
    static async consume(tx: any, data: { companyId: string, productId: string, quantity: number, eventId: string }) {
        let remainingToConsume = data.quantity;

        // Find available layers for this product, ordered by creation (FIFO)
        const layers = await tx.inventoryLayer.findMany({
            where: {
                companyId: data.companyId,
                productId: data.productId,
                quantityRemaining: { gt: 0 }
            },
            orderBy: { createdAt: 'asc' }
        });

        const totalAvailable = layers.reduce((acc: number, l: any) => acc + Number(l.quantityRemaining), 0);
        if (totalAvailable < data.quantity) {
            throw new Error(`Insufficient stock for product ${data.productId}. Required: ${data.quantity}, Available: ${totalAvailable}`);
        }

        for (const layer of layers) {
            if (remainingToConsume <= 0) break;

            const qtyInLayer = Number(layer.quantityRemaining);
            const qtyToTake = Math.min(remainingToConsume, qtyInLayer);

            // Record Consumption (Immutable Trace)
            await tx.inventoryConsumption.create({
                data: {
                    companyId: data.companyId,
                    layerId: layer.id,
                    consumptionEventId: data.eventId,
                    quantity: qtyToTake,
                    unitCostAtTime: layer.unitCost
                }
            });

            // Update Layer (Decoupled Remaining Qty)
            await tx.inventoryLayer.update({
                where: { id: layer.id },
                data: { quantityRemaining: { decrement: qtyToTake } }
            });

            remainingToConsume -= qtyToTake;
        }

        return true;
    }
}
