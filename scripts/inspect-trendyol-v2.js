const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;

    const supplierId = settings.supplierId;
    const authHeader = `Basic ${Buffer.from(settings.apiKey + ':' + settings.apiSecret).toString('base64')}`;

    const url = `https://apigw.trendyol.com/integration/sellers/${supplierId}/shipment-packages?size=5`;

    console.log(`Fetching packages from: ${url}`);
    const res = await fetch(url, {
        headers: {
            'Authorization': authHeader,
            'User-Agent': `${supplierId} - SelfIntegration`,
            'x-agentname': `${supplierId} - SelfIntegration`,
            'Accept': 'application/json'
        }
    });

    if (res.ok) {
        const data = await res.json();
        console.log("PACKAGES CONTENT:", JSON.stringify(data.content?.[0], null, 2));
    } else {
        console.log("Error status:", res.status);
        console.log(await res.text());
    }
}

run().finally(() => prisma.$disconnect());
