import { CarrierAdapter, CreateShipmentInput, CreateShipmentResult, CarrierEvent } from './adapter';

export class ManualCarrier implements CarrierAdapter {
    async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
        // Manual carrier does not really create an actual tracking number via API
        // It's meant to be managed by hand by the seller side. 
        // We will return a placeholder or await the tracking number generated via front-end input.
        const mockTrackingNumber = `MANUAL-${Date.now()}`;
        return {
            trackingNumber: mockTrackingNumber,
            labelUrl: null
        };
    }

    async cancelShipment(trackingNumber: string): Promise<void> {
        // No-op for manual
        return Promise.resolve();
    }

    async track(trackingNumber: string): Promise<CarrierEvent[]> {
        // Manual tracking generally doesn't fetch automated events
        return [];
    }
}
