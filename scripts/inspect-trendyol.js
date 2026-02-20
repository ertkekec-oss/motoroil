const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'trendyol' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;

    const supplierId = settings.supplierId;
    const authHeader = `Basic ${Buffer.from(settings.apiKey + ':' + settings.apiSecret).toString('base64')}`;

    // Attempt to find a recent order to inspect its structure
    const url = `https://apigw.trendyol.com/integration/order/sellers/${supplierId}/orders?size=5`;

    console.log(`Fetching orders from: ${url}`);
    const res = await fetch(url, {
        headers: {
            'Authorization': authHeader,
            'User-Agent': `${supplierId} - SelfIntegration`
        }
    });

    if (res.ok) {
        const data = await res.json();
        if (data.content && data.content.length > 0) {
            console.log("FIRST ORDER KEYS:", Object.keys(data.content[0]));
            console.log("CARGO PROVIDER:", data.content[0].cargoProviderName);
            console.log("DELIVERY MODEL:", data.content[0].deliveryModel);
            console.log("FULL FIRST ORDER:", JSON.stringify(data.content[0], null, 2));
        } else {
            console.log("No orders found.");
        }
    } else {
        console.log("Error status:", res.status);
        console.log(await res.text());
    }
}

run().finally(() => prisma.$disconnect());
