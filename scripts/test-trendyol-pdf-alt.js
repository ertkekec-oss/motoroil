const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPdfLabelFormat2() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;

    // test 1: Old PDF endpoint
    let url = `https://apigw.trendyol.com/integration/sellers/${supp}/common-label/7330031064550009?format=PDF`; // maybe a query param?
    console.log("Testing 1...");
    let r = await fetch(url, { headers: { 'Authorization': authHeader } });
    console.log(r.status);
    console.log(await r.text());

    // test 2: Try another URL
    let url2 = `https://apigw.trendyol.com/integration/sellers/${supp}/shipment-packages/3679014643/labels`;
    console.log("Testing 2...");
    r = await fetch(url2, { headers: { 'Authorization': authHeader } });
    console.log(r.status);
    
}

testPdfLabelFormat2().catch(console.error).finally(() => prisma.$disconnect());
