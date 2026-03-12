import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function run() {
    const hb = new HepsiburadaService({ merchantId: 'dummy' });
    const dummyPayload = {
        "id": "69afde01-fc34-6f4e-e1dd-04bf06060606",
        "orderNumber": "4655737501",
        "orderDate": "2026-03-10T12:01:52",
        "customer": null,
        "items": []
    };
    try {
        const mapped = hb['mapOrder'](dummyPayload, 'UNKNOWN');
        console.log(mapped);
    } catch(e) {
        console.log("ERROR TRACE", e);
    }
}
run();
