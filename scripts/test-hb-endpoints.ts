import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };
    const hb = new HepsiburadaService(config);

    const begin = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const end = new Date();
    const bStr = hb['hbDateYmdHi'](hb['startOfDay'](begin));
    const eStr = hb['hbDateYmdHi'](hb['endOfDay'](end));

    const syncTargets = [
        { name: 'UNPACKED', urlPart: `orders/merchantid/${config.merchantId}`, params: ['limit', 'offset', 'begindate', 'enddate'] },
        { name: 'PACKED', urlPart: `packages/merchantid/${config.merchantId}/packed`, params: ['limit', 'offset', 'begindate', 'enddate'] },
        { name: 'SHIPPED', urlPart: `packages/merchantid/${config.merchantId}/shipped`, params: ['begindate', 'enddate', 'limit', 'offset'] },
        { name: 'DELIVERED', urlPart: `packages/merchantid/${config.merchantId}/delivered`, params: ['begindate', 'enddate', 'limit', 'offset'] },
        { name: 'CANCELLED', urlPart: `orders/merchantid/${config.merchantId}/cancelled`, params: ['begindate', 'enddate', 'limit', 'offset'] }
    ];

    for (const target of syncTargets) {
        let url = `https://oms-external.hepsiburada.com/${target.urlPart}?limit=1&offset=0`;
        if (target.params.includes('begindate')) url += `&begindate=${encodeURIComponent(bStr)}`;
        if (target.params.includes('enddate')) url += `&enddate=${encodeURIComponent(eStr)}`;
        
        console.log(`Testing ${target.name} | URL: ${url}`);
        try {
            const res = await hb['safeFetchJson'](url, { headers: hb['getHeaders']() });
            
            let data = res.data;
            let items: any[] = [];
            if (Array.isArray(data)) items = data;
            else if (data && typeof data === 'object') {
                items = data.items || data.data || data.packages || data.orders || (data.id || data.orderNumber ? [data] : []);
            }
            console.log(` -> SUCCESS! Count: ${items.length}`);
        } catch (err: any) {
             console.log(` -> ERROR! Status: ${err.httpStatus} | Msg: ${err.message}`);
        }
    }
}
run();
