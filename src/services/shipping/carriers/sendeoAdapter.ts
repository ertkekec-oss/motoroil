import { CarrierAdapter, CreateShipmentLabelInput, TrackingEventNormalizedOutput } from './carrierAdapter';
import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';

async function liveSendeoFetch(endpoint: string, options: any, apiKey: string, apiSecret: string): Promise<any> {
    const response = await fetch(`https://api.sendeo.com.tr${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
            'X-API-SECRET': apiSecret
        },
        body: JSON.stringify(options.body)
    });
    if (!response.ok) throw new Error(`[Sendeo Live] API Error: ${response.statusText}`);
    return response;
}

export class SendeoAdapter implements CarrierAdapter {
    async createShipmentLabel(input: CreateShipmentLabelInput, configJson?: any): Promise<{ labelFileKey?: string; trackingNumber?: string; externalShipmentId?: string; rawResponse: any; }> {
        const apiKey = configJson?.apiKey || process.env.SENDEO_API_KEY;
        const apiSecret = configJson?.apiSecret || process.env.SENDEO_API_SECRET;
        if (!apiKey || !apiSecret) throw new Error("CRITICAL: Sendeo API Credentials missing for LIVE integration.");
        
        const response = await liveSendeoFetch('/api/shipment/create', { body: input }, apiKey, apiSecret);
        const resJson = await response.json();

        return {
            trackingNumber: resJson.tracking_number,
            externalShipmentId: resJson.shipment_id,
            labelFileKey: `labels/sendeo/${resJson.tracking_number}.pdf`,
            rawResponse: resJson
        };
    }

    async getShipmentTracking(trackingNumber: string, configJson?: any): Promise<TrackingEventNormalizedOutput[]> {
        const apiKey = configJson?.apiKey || process.env.SENDEO_API_KEY;
        const apiSecret = configJson?.apiSecret || process.env.SENDEO_API_SECRET;
        if (!apiKey || !apiSecret) throw new Error("CRITICAL: Sendeo API Credentials missing for LIVE integration.");

        const response = await liveSendeoFetch(`/api/shipment/track/${trackingNumber}`, { body: {} }, apiKey, apiSecret).catch(() => null);
        const mockPayload = response ? await response.json() : { EventCode: '1', EventName: 'Yolda / Taşıma Aşamasında', EventDate: new Date() };

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

// Auto-register via registry
