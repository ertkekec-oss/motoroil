import { ShipmentStatus } from '@prisma/client';

export interface CarrierEvent {
    status: ShipmentStatus;
    description: string;
    occurredAt: Date;
    rawPayload: any;
}

export interface CreateShipmentInput {
    orderId: string;
    buyerCompanyId: string;
    sellerCompanyId: string;
    items: any[];
    dimensions?: {
        width: number;
        height: number;
        length: number;
        weight: number;
    };
    fromAddress?: any;
    toAddress?: any;
}

export interface CreateShipmentResult {
    trackingNumber: string;
    labelUrl: string | null;
}

export interface CarrierAdapter {
    createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
    cancelShipment(trackingNumber: string): Promise<void>;
    track(trackingNumber: string): Promise<CarrierEvent[]>;
}
