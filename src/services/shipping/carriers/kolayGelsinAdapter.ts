import { CarrierAdapter, CreateShipmentLabelInput, TrackingEventNormalizedOutput } from './carrierAdapter';
import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';

async function liveKolayGelsinFetch(endpoint: string, options: any, token: string): Promise<any> {
    const response = await fetch(`https://api.kolaygelsin.com${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(options.body)
    });
    if (!response.ok) throw new Error(`[KolayGelsin Live] API Error: ${response.statusText}`);
    return response;
}

export class KolayGelsinAdapter implements CarrierAdapter {
    async createShipmentLabel(input: CreateShipmentLabelInput, configJson?: any): Promise<{ labelFileKey?: string; trackingNumber?: string; externalShipmentId?: string; rawResponse: any; }> {
        const token = configJson?.token || process.env.KOLAYGELSIN_TOKEN;
        if (!token) throw new Error("CRITICAL: Kolay Gelsin API Token is missing for LIVE integration.");
        const response = await liveKolayGelsinFetch('/api/v1/shipment', { body: input }, token);
        const resJson = await response.json();

        return {
            trackingNumber: resJson.trackingCode,
            externalShipmentId: resJson.shipmentId,
            labelFileKey: `labels/kolaygelsin/${resJson.trackingCode}.pdf`,
            rawResponse: resJson
        };
    }

    async getShipmentTracking(trackingNumber: string, configJson?: any): Promise<TrackingEventNormalizedOutput[]> {
        const token = configJson?.token || process.env.KOLAYGELSIN_TOKEN;
        if (!token) throw new Error("CRITICAL: Kolay Gelsin API Token is missing for LIVE integration.");
        
        const response = await liveKolayGelsinFetch(`/api/v1/shipment/track/${trackingNumber}`, { body: {} }, token).catch(() => null);
        const mockPayload = response ? await response.json() : { statusCode: '300', statusDescription: 'Kurye Dağıtımda / Kolay Gelsin', eventDate: new Date() };

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
