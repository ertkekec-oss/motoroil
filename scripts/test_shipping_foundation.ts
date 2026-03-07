import { createDraftShipment, attachShipmentItems } from '../src/services/shipping/core/shipmentService';

async function testFoundation() {
    console.log("=== SHIPPING FOUNDATION TEST ===");

    try {
        const prisma = (await import('../src/lib/prisma')).default;
        const tenant = await prisma.tenant.upsert({
            where: { id: 'test-tenant-123' },
            update: {},
            create: { id: 'test-tenant-123', name: 'Test Tenant', ownerEmail: 'test@tenant.com', phone: '123' }
        });

        const shipment = await createDraftShipment({
            tenantId: 'test-tenant-123',
            orderId: 'test-order-999',
            sellerTenantId: 'seller-tenant',
            buyerTenantId: 'test-tenant-123',
            carrierCode: 'HEPSIJET',
            totalPackages: 2
        });

        console.log("1. Draft Shipment Created: ", shipment.id);

        const items = await attachShipmentItems(shipment.id, [
            { orderItemId: 'item-1', quantity: 2 },
            { orderItemId: 'item-2', quantity: 5 }
        ]);

        console.log("2. Items Attached for Partial Shipment: ", items.length);
        console.log("SUCCESS!");

    } catch (e) {
        console.error("FAILED:", e);
    }
}

testFoundation();
