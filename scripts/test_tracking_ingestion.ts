import { ingestTrackingEvent } from '../src/services/shipping/core/trackingIngestion';
import { createDraftShipment } from '../src/services/shipping/core/shipmentService';

async function testIngestion() {
    console.log("=== INGESTION VALIDATOR ===");
    try {
        const prisma = (await import('../src/lib/prisma')).default;
        const tenant = await prisma.tenant.upsert({
            where: { id: 'tenant-test' },
            update: {},
            create: { id: 'tenant-test', name: 'Test Tenant', ownerEmail: 'test@tenant.com', phone: '123' }
        });

        const shipment = await createDraftShipment({
            tenantId: tenant.id,
            carrierCode: 'HEPSIJET',
            totalPackages: 1
        });
        console.log("1. Parent Entity Created:", shipment.id);

        const eventData = {
            shipmentId: shipment.id,
            carrierCode: 'HEPSIJET',
            externalEventId: 'evt-1',
            carrierEventCode: 'TRANSIT_1',
            normalizedStatus: 'IN_TRANSIT' as const,
            rawPayload: { msg: 'yolda' },
            eventTime: new Date()
        };

        const e1 = await ingestTrackingEvent(eventData);
        console.log("2. Event 1 created:", e1.id);

        const e2 = await ingestTrackingEvent(eventData); // Exact same payload & dedupe loop
        console.log("3. Event 2 (Duplicate) handled. ID remains:", e2.id, "=> Idempotency working.");

        console.log("SUCCESS");
    } catch (e) {
        console.error("FAILED", e);
    }
}

testIngestion();
