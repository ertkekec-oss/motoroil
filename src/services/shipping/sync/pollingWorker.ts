import prisma from '@/lib/prisma';
import { JobDispatcher } from '@/services/jobs/jobDispatcher';
export async function pollingWorker(carrierCode: string, batchSize: number = 50) {
    const activeShipments = await prisma.networkShipment.findMany({
        where: {
            carrierCode,
            status: {
                notIn: ['DRAFT', 'LABEL_PENDING', 'DELIVERED', 'RETURNED', 'CANCELED', 'DELIVERY_FAILED']
            },
            trackingNumber: { not: null }
        },
        take: batchSize,
        orderBy: { updatedAt: 'asc' } // oldest updated first
    });

    let dispatchCount = 0;

    for (const shipment of activeShipments) {
        if (!shipment.trackingNumber) continue;

        try {
            await JobDispatcher.dispatchJob({
                jobType: 'REFRESH_SHIPMENT_TRACKING',
                payload: {
                    shipmentId: shipment.id,
                    carrierCode,
                    trackingNumber: shipment.trackingNumber
                },
                idempotencyKey: `REFRESH_TRACKING_${shipment.id}_${Date.now()}` // Allow multiple eventually but we might throttle elsewhere
            });

            // Touch updatedAt to cycle it to back of queue so polling moves on
            await prisma.networkShipment.update({ where: { id: shipment.id }, data: { updatedAt: new Date() } });
            dispatchCount++;
        } catch (error) {
            console.error(`[PollingWorker] Error dispatching refresh for ${shipment.id}:`, error);
        }
    }

    return { totalDispatched: dispatchCount };
}
