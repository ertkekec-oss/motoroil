import { CarrierAdapter, CreateShipmentLabelInput, TrackingEventNormalizedOutput } from './carrierAdapter';
import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';
import { registerCarrierAdapter } from './carrierRegistry';

function mockHepsiJetFetch(endpoint: string, options: any): Promise<any> {
    // This mocks the actual fetch call to HepsiJet API
    return Promise.resolve({
        ok: true,
        json: async () => ({
            data: { barcode: 'HJ' + Math.floor(Math.random() * 100000000), trackingUrl: 'https://hepsijet.com/track', status: 'SUCCESS' }
        })
    });
}

export class HepsiJetAdapter implements CarrierAdapter {
    async createShipmentLabel(input: CreateShipmentLabelInput, configJson?: any): Promise<{ labelFileKey?: string; trackingNumber?: string; externalShipmentId?: string; rawResponse: any; }> {
        console.log(`[HepsiJetAdapter] Creating label for shipment ${input.shipmentId}`);
        const response = await mockHepsiJetFetch('/v1/shipments/create', { body: input });
        const resJson = await response.json();

        return {
            trackingNumber: resJson.data.barcode,
            externalShipmentId: resJson.data.barcode,
            labelFileKey: `labels/hj/${resJson.data.barcode}.pdf`,
            rawResponse: resJson
        };
    }

    async getShipmentTracking(trackingNumber: string, configJson?: any): Promise<TrackingEventNormalizedOutput[]> {
        console.log(`[HepsiJetAdapter] Getting tracking for ${trackingNumber}`);
        // Mocked response
        const mockPayload = { status: 'IN_TRANSIT', description: 'Gonderi Yolda', time: new Date() };

        return [{
            carrierEventCode: 'IT_100',
            description: mockPayload.description,
            normalizedStatus: this.normalizeTrackingEvent(mockPayload),
            rawPayload: mockPayload,
            eventTime: mockPayload.time
        }];
    }

    async cancelShipment(trackingNumber: string, configJson?: any): Promise<boolean> {
        console.log(`[HepsiJetAdapter] Canceling shipment ${trackingNumber}`);
        return true;
    }

    normalizeTrackingEvent(payload: any): NetworkShipmentTrackingNormalizedStatus {
        const rawStatus = (payload.status || '').toUpperCase();

        if (rawStatus.includes('CREATED') || rawStatus === 'NEW') return 'LABEL_CREATED';
        if (rawStatus.includes('PICK')) return 'PICKED_UP';
        if (rawStatus.includes('TRANSIT')) return 'IN_TRANSIT';
        if (rawStatus.includes('DELIVERY') && rawStatus.includes('OUT')) return 'OUT_FOR_DELIVERY';
        if (rawStatus === 'DELIVERED') return 'DELIVERED';
        if (rawStatus.includes('RETURN')) return 'RETURNED';
        if (rawStatus.includes('CANCEL')) return 'CANCELED';
        if (rawStatus.includes('FAIL') || rawStatus.includes('EXCEPTION')) return 'DELIVERY_EXCEPTION';

        return 'IN_TRANSIT'; // fallback
    }
}

// Auto-register
registerCarrierAdapter('HEPSIJET', new HepsiJetAdapter());
