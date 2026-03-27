import { CarrierAdapter, CreateShipmentLabelInput, TrackingEventNormalizedOutput } from './carrierAdapter';
import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';
import { registerCarrierAdapter } from './carrierRegistry';

function mockSendeoFetch(endpoint: string, options: any): Promise<any> {
    // Mock the external Sendeo shipping API calls for automated logistics cost reconciliation
    return Promise.resolve({
        ok: true,
        json: async () => ({
            result: 'Success',
            tracking_number: 'SND' + Math.floor(Math.random() * 100000000),
            shipment_id: 'SND_EXT_' + Math.floor(Math.random() * 100000000),
            logistics_desi: options?.body?.packages?.[0]?.volume || 1,
            estimated_cost: (options?.body?.packages?.[0]?.volume || 1) * 20.0, // 20 TL / desi baseline mutabakat
        })
    });
}

export class SendeoAdapter implements CarrierAdapter {
    async createShipmentLabel(input: CreateShipmentLabelInput, configJson?: any): Promise<{ labelFileKey?: string; trackingNumber?: string; externalShipmentId?: string; rawResponse: any; }> {
        console.log(`[SendeoAdapter] Creating label for shipment ${input.shipmentId}`);
        const response = await mockSendeoFetch('/api/shipment/create', { body: input });
        const resJson = await response.json();

        return {
            trackingNumber: resJson.tracking_number,
            externalShipmentId: resJson.shipment_id,
            labelFileKey: `labels/sendeo/${resJson.tracking_number}.pdf`,
            rawResponse: resJson
        };
    }

    async getShipmentTracking(trackingNumber: string, configJson?: any): Promise<TrackingEventNormalizedOutput[]> {
        console.log(`[SendeoAdapter] Getting tracking for ${trackingNumber}`);
        const mockPayload = { EventCode: '1', EventName: 'Yolda / Taşıma Aşamasında', EventDate: new Date() };

        return [{
            carrierEventCode: 'SND_TRANSIT',
            description: mockPayload.EventName,
            normalizedStatus: this.normalizeTrackingEvent(mockPayload),
            rawPayload: mockPayload,
            eventTime: mockPayload.EventDate
        }];
    }

    async cancelShipment(trackingNumber: string, configJson?: any): Promise<boolean> {
        console.log(`[SendeoAdapter] Canceling shipment ${trackingNumber}`);
        return true;
    }

    normalizeTrackingEvent(payload: any): NetworkShipmentTrackingNormalizedStatus {
        const rawStatus = (payload.EventName || '').toUpperCase();

        if (rawStatus.includes('YENI') || rawStatus === 'NEW') return 'LABEL_CREATED';
        if (rawStatus.includes('ALINDI') || rawStatus.includes('KABUL')) return 'PICKED_UP';
        if (rawStatus.includes('TRANSFER') || rawStatus.includes('YOLDA')) return 'IN_TRANSIT';
        if (rawStatus.includes('DAGITIM') || rawStatus.includes('ŞUBEDE')) return 'OUT_FOR_DELIVERY';
        if (rawStatus.includes('TESLIM') && !rawStatus.includes('EDILEMEDI')) return 'DELIVERED';
        if (rawStatus.includes('IADE')) return 'RETURNED';
        if (rawStatus.includes('IPTAL')) return 'CANCELED';
        if (rawStatus.includes('SORUN') || rawStatus.includes('HASAR')) return 'DELIVERY_EXCEPTION';

        return 'IN_TRANSIT'; 
    }
}

// Auto-register Sendeo Mutabakat and API Integration Provider
registerCarrierAdapter('SENDEO', new SendeoAdapter());
