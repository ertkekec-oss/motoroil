import { CarrierAdapter } from './carrierAdapter';

const adapters: Record<string, CarrierAdapter> = {};

export function registerCarrierAdapter(carrierCode: string, adapter: CarrierAdapter) {
    adapters[carrierCode] = adapter;
}

export function resolveCarrierAdapter(carrierCode: string): CarrierAdapter {
    const adapter = adapters[carrierCode];
    if (!adapter) {
        throw new Error(`Carrier adapter for '${carrierCode}' not found`);
    }
    return adapter;
}

export function assertCarrierSupported(carrierCode: string): boolean {
    return !!adapters[carrierCode];
}
