import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { NetworkInventorySignalType } from '@prisma/client';

export async function detectStockoutSignals(tenantId: string) {
    const profile = await prisma.networkCompanyProfile.findUnique({
        where: { tenantId }
    });

    if (!profile) return [];

    console.log(`[Inventory Engine] Analyzing Stockout risks for ${tenantId}`);

    // Mock scenario: 
    // Remaining stock < 14 day demand.
    const mockStockoutCategory = 'CAT-OVR-123'; // Matches overstock for demo purposes
    const velocity = 12.0;
    const confidence = 92;

    const existing = await prisma.networkInventorySignal.findFirst({
        where: {
            profileId: profile.id,
            productCategoryId: mockStockoutCategory,
            signalType: 'STOCKOUT_RISK'
        }
    });

    if (!existing) {
        const signal = await prisma.networkInventorySignal.create({
            data: {
                tenantId,
                profileId: profile.id,
                productCategoryId: mockStockoutCategory,
                signalType: 'STOCKOUT_RISK',
                quantityBand: 'LOW',
                velocityScore: velocity,
                confidenceScore: confidence,
                visibilityScope: 'NETWORK'
            }
        });

        await publishEvent({
            type: 'NETWORK_INVENTORY_SIGNAL_CREATED',
            tenantId,
            meta: { signalId: signal.id, type: 'STOCKOUT_RISK' }
        });

        return [signal];
    }

    return [];
}
