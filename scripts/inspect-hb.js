const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'hepsiburada' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authHeader = `Basic ${Buffer.from(settings.merchantId + ':' + settings.password).toString('base64')}`;
    const url = `https://oms-external.hepsiburada.com/packages/merchantid/${settings.merchantId}/delivered?limit=1`;
    const res = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test' } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}
run().finally(() => prisma.$disconnect());
