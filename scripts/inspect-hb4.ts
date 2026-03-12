import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };
    const hb = new HepsiburadaService(config);

    console.log("Testing generic package list with dates...");
    let url = `https://oms-external.hepsiburada.com/packages/merchantid/${config.merchantId}?limit=1&offset=0&begindate=2026-03-01%2000%3A00&enddate=2026-03-12%2023%3A59`;
    try {
        const res = await hb['safeFetchJson'](url, { headers: hb['getHeaders']() });
        console.log("Success! Items count:", Array.isArray(res.data) ? res.data.length : res.data?.length);
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}
run();
