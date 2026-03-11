const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    if(!config) return console.error("Config not found");
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    const supp = settings.supplierId;
    const pkgId = '3679014643';

    const url = `https://apigw.trendyol.com/integration/order/sellers/${supp}/shipment-packages/${pkgId}`;
    
    // Using lineId = 5270035833
    const reqBody = {
        lines: [ { lineId: 5270035833, quantity: 1 } ],
        params: {},
        status: "Picking"
    };

    console.log(`PUT ${url}`);
    const r = await fetch(url, { 
        method: 'PUT', 
        headers: { 
            'Authorization': authHeader, 
            'User-Agent': `${supp} - SelfIntegration`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
    });
    console.log(`Status: ${r.status}`);
    const text = await r.text();
    console.log(`Response: ${text}`);
}

testUpdate().catch(console.error).finally(() => prisma.$disconnect());
