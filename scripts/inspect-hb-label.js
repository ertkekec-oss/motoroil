const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const config = await prisma.marketplaceConfig.findFirst({ where: { type: 'hepsiburada' } });
    const settings = typeof config.settings === 'string' ? JSON.parse(config.settings) : config.settings;
    const authHeader = `Basic ${Buffer.from(settings.merchantId + ':' + settings.password).toString('base64')}`;
    const merchantId = settings.merchantId.trim();
    const pkgNo = "5437154754";
    const url = `https://oms-external.hepsiburada.com/packages/merchantid/${merchantId}/packagenumber/${pkgNo}/labels?format=PDF`;
    const res = await fetch(url, { headers: { 'Authorization': authHeader, 'User-Agent': settings.username || 'Test', 'Accept': 'application/json' } });
    const data = await res.json();
    console.log("JSON structure:", JSON.stringify({ ...data, data: (typeof data.data === 'string' ? data.data.substring(0, 100) + "..." : data.data) }, null, 2));
}
run().finally(() => prisma.$disconnect());
