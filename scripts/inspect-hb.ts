import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };
    const hb = new HepsiburadaService(config);

    console.log("Fetching order 4655737501 (Emre Yalavaç - SHIPPED)...");
    const order1 = await hb.getOrderByNumber('4655737501');
    console.log("Full Order 4655737501 data:", JSON.stringify(order1, null, 2));

    console.log("Fetching order 4150187025 (İzzeddin Gümüşçü - DELIVERED)...");
    const order2 = await hb.getOrderByNumber('4150187025');
    console.log("Full Order 4150187025 data:", JSON.stringify(order2, null, 2));
    
    // Check what the 'SHIPPED' packages list returns:
    const merchantId = config.merchantId;
    const url = `https://oms-external.hepsiburada.com/packages/merchantid/${merchantId}/shipped?limit=2&offset=0`;
    console.log("Fetching SHIPPED packages list...");
    try {
        const res = await hb['safeFetchJson'](url, { headers: hb['getHeaders']() });
        console.log("SHIPPED list data:", JSON.stringify(res.data, null, 2));
    } catch(err) {
        console.log("Shipped list error", err);
    }
}
run();
