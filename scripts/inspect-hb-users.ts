import { HepsiburadaService } from '../src/services/marketplaces/hepsiburada';

async function run() {
    const config = {
        merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229',
        username: 'motoroil_dev',
        password: '3desgg5vveSu',
        isTest: false
    };
    const hb = new HepsiburadaService(config);

    const ordersToTest = ['4319156565', '4480163364'];
    
    for (const orderNum of ordersToTest) {
        console.log(`\n--- Fetching Order: ${orderNum} ---`);
        
        try {
            // First let's get raw order detail
            const url = `https://oms-external.hepsiburada.com/orders/merchantid/${config.merchantId}/ordernumber/${orderNum}`;
            const res = await hb['safeFetchJson'](url, { headers: hb['getHeaders']() });
            
            console.log(`RAW API Response for ${orderNum} exists:`, !!res.data);
            if (res.data) {
                const mapped = hb['mapOrder'](res.data, 'UNKNOWN');
                console.log(`MAPPED Name: ${mapped.customerName}, Date: ${mapped.orderDate.toISOString()}, Total: ${mapped.totalAmount}, Status: ${mapped.status}, Items: ${mapped.items.length}`);
            }

            // Also check packages by order number
            const pkgUrl = `https://oms-external.hepsiburada.com/packages/merchantid/${config.merchantId}/ordernumber/${orderNum}`;
            try {
                const pkgRes = await hb['safeFetchJson'](pkgUrl, { headers: hb['getHeaders']() });
                console.log(`PACKAGES Response for ${orderNum} exists:`, typeof pkgRes.data !== 'undefined');
                if (pkgRes.data) {
                    const samplePkg = Array.isArray(pkgRes.data) ? pkgRes.data[0] : pkgRes.data;
                    console.log(`PKG Sample Info: ID: ${samplePkg?.id}, Customer: ${samplePkg?.customerName || samplePkg?.recipientName || 'NONE'}`);
                    const pkgMapped = hb['mapOrder'](samplePkg, 'DELIVERED');
                    console.log(`PKG MAPPED Name: ${pkgMapped.customerName}, Date: ${pkgMapped.orderDate.toISOString()}, Total: ${pkgMapped.totalAmount}, Status: ${pkgMapped.status}, Items: ${pkgMapped.items.length}`);
                }
            } catch (err: any) {
                console.log(`Packages fetch failed: ${err.message}`);
            }

        } catch (e: any) {
            console.log(`Error on ${orderNum}: ${e.message}`);
        }
    }
}
run();
