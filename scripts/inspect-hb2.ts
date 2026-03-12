import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };
    const hb = new HepsiburadaService(config);

    console.log("Fetching order 4655737501 (Emre Yalavaç - SHIPPED) RAW...");
    const url = `https://oms-external.hepsiburada.com/orders/merchantid/${config.merchantId}/ordernumber/4655737501`;
    const res = await hb['safeFetchJson'](url, { headers: hb['getHeaders']() });
    console.log("Raw API Response data:", JSON.stringify(res.data, null, 2));

}
run();
