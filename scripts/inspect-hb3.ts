import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };
    const hb = new HepsiburadaService(config);

    console.log("Testing generic package list...");
    let url = `https://oms-external.hepsiburada.com/packages/merchantid/${config.merchantId}?limit=3&offset=0`;
    try {
        const res = await hb['safeFetchJson'](url, { headers: hb['getHeaders']() });
        console.log("Generic packages:", JSON.stringify(res.data, null, 2));
    } catch (err: any) {
        console.log("Generic packages error:", err.message);
    }
}
run();
