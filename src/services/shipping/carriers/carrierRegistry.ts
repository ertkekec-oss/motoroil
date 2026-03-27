import { CarrierAdapter } from './carrierAdapter';
import { HepsiJetAdapter } from './hepsijetAdapter';
import { SendeoAdapter } from './sendeoAdapter';
import { KolayGelsinAdapter } from './kolayGelsinAdapter';

const adapters: Record<string, CarrierAdapter> = {
    'HEPSIJET': new HepsiJetAdapter(),
    'SENDEO': new SendeoAdapter(),
    'KOLAYGELSINMP': new KolayGelsinAdapter()
};

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
