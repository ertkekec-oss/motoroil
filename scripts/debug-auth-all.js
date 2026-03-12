const https = require('https');

async function testHepsiburadaAuth() {
    const merchantId = 'f225561c-5ae7-4208-9eb4-3541340b7229';
    const pass = '3desgg5vveSu';
    const authOld = 'Basic ' + Buffer.from(merchantId + ':' + pass).toString('base64');
    
    // Test base URL direct (as tested earlier)
    await fetchUrl('https://oms-external.hepsiburada.com/orders/merchantid/' + merchantId + '?offset=0&limit=1', authOld, 'Direct OLD Auth (MerchantId:Pass)');

    // Test proxy
    await fetchUrl('http://38.242.134.156:1561/hepsiburada/orders/merchantid/' + merchantId + '?offset=0&limit=1', authOld, 'Proxy path /hepsiburada (MerchantId:Pass)');
    
    // NEW Auth:
    const username = 'motoroil_dev';
    const authNew = 'Basic ' + Buffer.from(username + ':' + pass).toString('base64');
    await fetchUrl('https://oms-external.hepsiburada.com/orders/merchantid/' + merchantId + '?offset=0&limit=1', authNew, 'Direct NEW Auth (Username:Pass)');
}

async function fetchUrl(url, authHdr, label) {
    try {
        console.log(`\n============ ${label} ============`);
        console.log(`URL: ${url}`);
        const res = await fetch(url, {
            headers: {
                 'Authorization': authHdr,
                 'User-Agent': 'motoroil_dev',
                 'Content-Type': 'application/json',
                 'Accept': 'application/json'
            }
        });
        console.log('Status:', res.status);
        console.log('Body:', await res.text());
    } catch(e) {
        console.log('Error:', e.message);
    }
}

testHepsiburadaAuth();
