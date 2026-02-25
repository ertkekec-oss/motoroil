import { CarrierAdapter, CreateShipmentInput, CreateShipmentResult, CarrierEvent } from './adapter';

export class MockCarrier implements CarrierAdapter {
    async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
        // Mock creating a shipment on a logistics provider (like Yurtiçi, Aras, MNG)
        const mockTrackingNumber = `TRK${Date.now()}${(Math.random() * 1000).toFixed(0)}`;
        return {
            trackingNumber: mockTrackingNumber,
            labelUrl: `https://mock-carrier.com/label/${mockTrackingNumber}.pdf`
        };
    }

    async cancelShipment(trackingNumber: string): Promise<void> {
        console.log(`Mock shipment ${trackingNumber} cancelled.`);
        return Promise.resolve();
    }

    async track(trackingNumber: string): Promise<CarrierEvent[]> {
        return [
            {
                status: 'IN_TRANSIT',
                description: 'Mock package is in transit',
                occurredAt: new Date(),
                rawPayload: { eventId: 1 }
            }
        ];
    }
}
