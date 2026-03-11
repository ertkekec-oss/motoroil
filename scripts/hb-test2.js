const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testHB() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'hepsiburada' } });
    if (!config) return console.log('HB config not found');
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.merchantId}:${settings.password}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    const proxyKey = process.env.PERIODYA_PROXY_KEY || '';
    const proxyUrlBase = process.env.MARKETPLACE_PROXY_URL || '';
    console.log(`Using Proxy: ${proxyUrlBase}`);

    const targetUrl = `https://oms-external.hepsiburada.com/orders/merchantid/${settings.merchantId}?limit=50&offset=0`;
    const fetchUrl = proxyUrlBase ? `${proxyUrlBase}?url=${encodeURIComponent(targetUrl)}` : targetUrl;
    
    console.log(`GET ${targetUrl}`);
    
    try {
        const headers = { 
            'Authorization': authHeader, 
            'User-Agent': settings.username || 'Test', 
            'Accept': 'application/json',
            ...(proxyKey ? { 'X-Periodya-Key': proxyKey } : {})
        };
        const res = await fetch(fetchUrl, { headers });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body (first 200 chars): ${text.substring(0, 200)}`);
    } catch(err) {
        console.error('Fetch error:', err);
    }
}

testHB().catch(console.error).finally(() => prisma.$disconnect());
