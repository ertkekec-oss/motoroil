const https = require('https');
async function test() {
    const merchantId = 'f225561c-5ae7-4208-9eb4-3541340b7229';
    const authOld = 'Basic ' + Buffer.from(merchantId + ':' + '3desgg5vveSu').toString('base64');
    const url = 'https://oms-external.hepsiburada.com/orders/merchantid/' + merchantId + '/cancelled?offset=0&limit=1';
    const res = await fetch(url, { headers: { 'Authorization': authOld, 'User-Agent': 'motoroil_dev' } });
    console.log(await res.text());
}
test();
