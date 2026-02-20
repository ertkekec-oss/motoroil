const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'hepsiburada' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authHeader = `Basic ${Buffer.from(settings.merchantId + ':' + settings.password).toString('base64')}`;
    const merchantId = settings.merchantId.trim();
    const orderNo = "4402306136";

    const urls = [
        `https://oms-external.hepsiburada.com/orders/merchantid/${merchantId}/ordernumber/${orderNo}`,
        `https://oms-external.hepsiburada.com/packages/merchantid/${merchantId}/ordernumber/${orderNo}`
    ];

    for (const url of urls) {
        console.log(`TRYING: ${url}`);
        const res = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test' } });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(await res.text());
        }
        console.log('---');
    }
}
run().finally(() => prisma.$disconnect());
