import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { NetworkInventorySignalType } from '@prisma/client';

export async function detectDemandSignals(tenantId: string) {
    const profile = await prisma.networkCompanyProfile.findUnique({
        where: { tenantId }
    });

    if (!profile) return [];

    console.log(`[Inventory Engine] Analyzing Demand signals for ${tenantId}`);

    // Mock scenario: 
    // Sales velocity high, demand trend increasing
    const mockDemandCategory = 'CAT-DMD-999';
    const velocity = 25.0;
    const confidence = 95;

    const existing = await prisma.networkInventorySignal.findFirst({
        where: {
            profileId: profile.id,
            productCategoryId: mockDemandCategory,
            signalType: 'HIGH_DEMAND'
        }
    });

    if (!existing) {
        const signal = await prisma.networkInventorySignal.create({
            data: {
                tenantId,
                profileId: profile.id,
                productCategoryId: mockDemandCategory,
                signalType: 'HIGH_DEMAND',
                quantityBand: 'HIGH',
                velocityScore: velocity,
                confidenceScore: confidence,
                visibilityScope: 'NETWORK'
            }
        });

        await publishEvent({
            type: 'NETWORK_INVENTORY_SIGNAL_CREATED',
            tenantId,
            meta: { signalId: signal.id, type: 'HIGH_DEMAND' }
        });

        return [signal];
    }

    return [];
}
