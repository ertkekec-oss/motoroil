import { NetworkShipmentTrackingNormalizedStatus } from '@prisma/client';

export interface CreateShipmentLabelInput {
    shipmentId: string;
    orderId?: string;
    senderAddress: {
        city: string;
        district: string;
        address: string;
        contactName: string;
        phone: string;
    };
    receiverAddress: {
        city: string;
        district: string;
        address: string;
        contactName: string;
        phone: string;
    };
    packages: Array<{
        weight?: number;
        volume?: number;
        barcode?: string;
    }>;
}

export interface TrackingEventNormalizedOutput {
    carrierEventCode?: string;
    description?: string;
    locationText?: string;
    rawPayload: any;
    eventTime: Date;
    normalizedStatus: NetworkShipmentTrackingNormalizedStatus;
}

export interface CarrierAdapter {
    createShipmentLabel(input: CreateShipmentLabelInput, configJson?: any): Promise<{
        labelFileKey?: string;
        trackingNumber?: string;
        externalShipmentId?: string;
        rawResponse: any
    }>;
    getShipmentTracking(trackingNumber: string, configJson?: any): Promise<TrackingEventNormalizedOutput[]>;
    cancelShipment(trackingNumber: string, configJson?: any): Promise<boolean>;
    normalizeTrackingEvent(payload: any): NetworkShipmentTrackingNormalizedStatus;
}
