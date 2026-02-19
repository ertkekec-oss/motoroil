
import { PrismaClient } from '@prisma/client';
import { HepsiburadaService } from './src/services/marketplaces/hepsiburada';

const prisma = new PrismaClient();

async function main() {
    const orderNumber = '4323752771';
    const order = await prisma.order.findFirst({ where: { orderNumber } });
    if (!order) {
        console.log('Order 4323752771 not found in DB');
        return;
    }
    const config = await prisma.marketplaceConfig.findFirst({ where: { companyId: order.companyId, type: 'hepsiburada' } });
    if (!config) return;

    const merchantId = config.settings.merchantId;
    const username = config.settings.username;
    const password = config.settings.password;
    const token = Buffer.from(`${merchantId}:${password}`).toString('base64');
    const authHeader = `Basic ${token}`;

    // Use oms-external.hepsiburada.com direct if no proxy, or use proxy if defined
    const proxy = (process.env.MARKETPLACE_PROXY_URL || '').trim().replace(/\/$/, '');
    const baseUrl = proxy ? `${proxy}/hepsiburada` : 'https://oms-external.hepsiburada.com';

    const targetUrl = `${baseUrl}/packages/merchantid/${merchantId}/delivered?limit=10`;

    console.log('Fetching from:', targetUrl);

    const headers = {
        'Authorization': authHeader,
        'User-Agent': username,
        'Accept': 'application/json'
    };

    const proxyKey = (process.env.PERIODYA_PROXY_KEY || '').trim();
    if (proxyKey) {
        headers['X-Periodya-Key'] = proxyKey;
    }

    const response = await fetch(targetUrl, { headers });
    console.log('Status:', response.status);

    if (response.ok) {
        const data = await response.json();
        console.log('RAW JSON DATA (first 2 orders):');
        const items = data.items || data.data || data;
        if (Array.isArray(items)) {
            console.log(JSON.stringify(items.slice(0, 2), null, 2));
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } else {
        console.log('Error:', await response.text());
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
