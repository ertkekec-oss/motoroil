const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPdfLabel() {
    let out = '';
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authString = `${settings.apiKey}:${settings.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const supp = settings.supplierId;
    
    // Testing the package that works in testScreenshots script
    const pkgIds = [3680378496, 3675034675, 3679014643];

    for (const pkgId of pkgIds) {
        console.log(`\nTesting label for package: ${pkgId}`);
        const url = `https://apigw.trendyol.com/integration/sellers/${supp}/labels?shipmentPackageIds=${pkgId}`;
        console.log(`GET ${url}`);
        let r = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Accept': 'application/pdf' } });
        console.log(`Status: ${r.status} ${r.headers.get('content-type')}`);
        
        let urlJson = `https://apigw.trendyol.com/integration/sellers/${supp}/labels?shipmentPackageIds=${pkgId}`;
        let rJson = await fetch(urlJson, { headers: { 'Authorization': authHeader, 'User-Agent': `${supp} - SelfIntegration`, 'Accept': 'application/json' } });
        console.log(`Status JSON: ${rJson.status}`);
        
        if (rJson.status === 556) {
           console.log(`Body JSON:`, await rJson.text());
        }
    }
}

testPdfLabel().catch(console.error).finally(() => prisma.$disconnect());
