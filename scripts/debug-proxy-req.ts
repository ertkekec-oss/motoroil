async function run() {
    const s = { merchantId: 'f225561c-5ae7-4208-9eb4-3541340b7229', username: 'motoroil_dev', password: '3desgg5vveSu' };
    const auth1 = `Basic ${Buffer.from(`${s.username}:${s.password}`).toString('base64')}`;
    
    const targetUrl = `https://oms-external.hepsiburada.com/orders/merchantid/${s.merchantId}?limit=10`;
    const proxyUrl = `http://38.242.134.156:1561/proxy?url=${encodeURIComponent(targetUrl)}`;

    console.log('Fetching through proxy...');
    const headers = { 
        'Authorization': auth1, 
        'User-Agent': s.username,
        'Accept': 'application/json'
    };
    
    let res = await fetch(proxyUrl, { headers });
    console.log('Status via proxy:', res.status);
    console.log('Response:', await res.text());
}
run();
