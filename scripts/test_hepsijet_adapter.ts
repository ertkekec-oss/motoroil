import { resolveCarrierAdapter } from '../src/services/shipping/carriers/carrierRegistry';
import '../src/services/shipping/carriers/hepsijetAdapter'; // to auto-register

async function testAdapter() {
    console.log("=== HEPSIJET ADAPTER MOCK TEST ===");

    try {
        const adapter = resolveCarrierAdapter('HEPSIJET');

        const labelRes = await adapter.createShipmentLabel({
            shipmentId: 'ship-123',
            senderAddress: { city: 'IST', district: 'SISLI', address: '...', contactName: '...', phone: '...' },
            receiverAddress: { city: 'ANK', district: 'CANKAYA', address: '...', contactName: '...', phone: '...' },
            packages: [{ weight: 2 }]
        });

        console.log("1. Label Simulated:", labelRes.trackingNumber);

        const trackingRes = await adapter.getShipmentTracking(labelRes.trackingNumber!);
        console.log("2. Tracking Interpolated:", trackingRes.length, "events. First status:", trackingRes[0].normalizedStatus);
        console.log("SUCCESS");
    } catch (e) {
        console.error("FAILED", e);
    }
}

testAdapter();
