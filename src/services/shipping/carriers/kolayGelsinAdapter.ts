import { CarrierAdapter, CreateShipmentLabelInput, TrackingEventNormalizedOutput } from './carrierAdapter';
import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';

function mockKolayGelsinFetch(endpoint: string, options: any): Promise<any> {
    return Promise.resolve({
        ok: true,
        json: async () => ({
            success: true,
            trackingCode: 'KG' + Math.floor(Math.random() * 100000000),
            shipmentId: 'KG_EXT_' + Math.floor(Math.random() * 100000000),
        })
    });
}

export class KolayGelsinAdapter implements CarrierAdapter {
    async createShipmentLabel(input: CreateShipmentLabelInput, configJson?: any): Promise<{ labelFileKey?: string; trackingNumber?: string; externalShipmentId?: string; rawResponse: any; }> {
        console.log(`[KolayGelsinAdapter] Creating label for shipment ${input.shipmentId}`);
        const response = await mockKolayGelsinFetch('/api/v1/shipment', { body: input });
        const resJson = await response.json();

        return {
            trackingNumber: resJson.trackingCode,
            externalShipmentId: resJson.shipmentId,
            labelFileKey: `labels/kolaygelsin/${resJson.trackingCode}.pdf`,
            rawResponse: resJson
        };
    }

    async getShipmentTracking(trackingNumber: string, configJson?: any): Promise<TrackingEventNormalizedOutput[]> {
        console.log(`[KolayGelsinAdapter] Getting tracking for ${trackingNumber}`);
        const mockPayload = { statusCode: '300', statusDescription: 'Kurye Dağıtımda / Kolay Gelsin', eventDate: new Date() };

        return [{
            carrierEventCode: mockPayload.statusCode,
            description: mockPayload.statusDescription,
            normalizedStatus: this.normalizeTrackingEvent(mockPayload),
            rawPayload: mockPayload,
            eventTime: mockPayload.eventDate
        }];
    }

    async cancelShipment(trackingNumber: string, configJson?: any): Promise<boolean> {
        console.log(`[KolayGelsinAdapter] Canceling shipment ${trackingNumber}`);
        return true;
    }

    normalizeTrackingEvent(payload: any): NetworkShipmentTrackingNormalizedStatus {
        const desc = (payload.statusDescription || '').toUpperCase();
        
        if (desc.includes('OLUSTURULDU') || desc === 'NEW') return 'LABEL_CREATED';
        if (desc.includes('ALINDI') || desc.includes('KABUL')) return 'PICKED_UP';
        if (desc.includes('TRANSFER') || desc.includes('YOLDA')) return 'IN_TRANSIT';
        if (desc.includes('DAGITIMDA') || desc.includes('KURYE')) return 'OUT_FOR_DELIVERY';
        if (desc.includes('TESLIM') && !desc.includes('EDILEMEDI')) return 'DELIVERED';
        if (desc.includes('IADE')) return 'RETURNED';
        if (desc.includes('IPTAL')) return 'CANCELED';
        if (desc.includes('HASAR') || desc.includes('ZAYI')) return 'DELIVERY_EXCEPTION';

        return 'IN_TRANSIT';
    }
}
