const https = require('https');

async function testHepsiburadaOrderDetail() {
    const merchantId = 'f225561c-5ae7-4208-9eb4-3541340b7229';
    const pass = '3desgg5vveSu';
    const authOld = 'Basic ' + Buffer.from(merchantId + ':' + pass).toString('base64');
    
    const orders = ["4448396788", "4299669947"];
    for (const o of orders) {
        const url = 'https://oms-external.hepsiburada.com/orders/merchantid/' + merchantId + '/ordernumber/' + o;
        const res = await fetch(url, { headers: { 'Authorization': authOld, 'User-Agent': 'motoroil_dev' } });
        console.log(`Status ${o}:`, res.status);
        const text = await res.text();
        console.log(`Body ${o}:`, text.substring(0, 300));
    }
}

testHepsiburadaOrderDetail();
