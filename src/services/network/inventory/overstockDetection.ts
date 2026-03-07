import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { NetworkInventorySignalType } from '@prisma/client';

export async function detectOverstockSignals(tenantId: string) {
    // In a real scenario, this would interact with an internal ERP adapter
    // that safely calculates these values without exposing raw rows.
    // For this demonstration, we'll mock the extraction of signals.

    const profile = await prisma.networkCompanyProfile.findUnique({
        where: { tenantId }
    });

    if (!profile) return [];

    console.log(`[Inventory Engine] Analyzing Overstock for ${tenantId}`);

    // Mock scenario: 
    // Category X has stock > 90 days demand.
    const mockOverstockedCategory = 'CAT-OVR-123';
    const velocity = 8.5; // items per day
    const confidence = 85;

    // Check if signal already exists recently
    const existing = await prisma.networkInventorySignal.findFirst({
        where: {
            profileId: profile.id,
            productCategoryId: mockOverstockedCategory,
            signalType: 'OVERSTOCK'
        }
    });

    if (!existing) {
        const signal = await prisma.networkInventorySignal.create({
            data: {
                tenantId,
                profileId: profile.id,
                productCategoryId: mockOverstockedCategory,
                signalType: 'OVERSTOCK',
                quantityBand: 'HIGH',
                velocityScore: velocity,
                confidenceScore: confidence,
                visibilityScope: 'NETWORK'
            }
        });

        await publishEvent({
            type: 'NETWORK_INVENTORY_SIGNAL_CREATED',
            tenantId,
            meta: { signalId: signal.id, type: 'OVERSTOCK' }
        });

        return [signal];
    }

    return [];
}
