
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({ where: { marketplace: 'Hepsiburada' } });
    if (!order) return;
    const config = await prisma.marketplaceConfig.findFirst({ where: { companyId: order.companyId, type: 'hepsiburada' } });
    if (!config) return;
    const { merchantId, password, username } = config.settings as any;
    const token = Buffer.from(`${merchantId}:${password}`).toString('base64');
    const proxy = (process.env.MARKETPLACE_PROXY_URL || '').trim().replace(/\/$/, '');
    const baseUrl = proxy ? `${proxy}/hepsiburada` : 'https://oms-external.hepsiburada.com';
    const headers = { 'Authorization': `Basic ${token}`, 'User-Agent': username, 'Accept': 'application/json' };
    const proxyKey = (process.env.PERIODYA_PROXY_KEY || '').trim();
    if (proxyKey) headers['X-Periodya-Key'] = proxyKey;

    const url = `${baseUrl}/orders/merchantid/${merchantId}?limit=5`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log('DELIVERED RAW:', JSON.stringify(data, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
