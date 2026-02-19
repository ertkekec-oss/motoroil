import { PazaramaService } from './src/services/marketplaces/pazarama';
import { prisma } from './src/lib/prisma';

async function testEndpoints() {
    const companyId = 'cmlsmhyap000e8fcnemogl9hn';
    const orderNumber = '140301491';

    const config = await prisma.marketplaceConfig.findFirst({
        where: { companyId, type: 'pazarama' }
    });

    if (!config || !config.settings) {
        console.error('Config not found');
        return;
    }

    const service = new PazaramaService(config.settings as any);
    const baseUrl = (service as any).baseUrl;
    const headers = await (service as any).getHeaders();

    const variants = [
        { url: `${baseUrl}/order/getOrderDetailForApi?orderNumber=${orderNumber}`, method: 'GET' },
        { url: `${baseUrl}/order/getOrderDetailForApi`, method: 'POST', body: { orderNumber } },
        { url: `${baseUrl}/order/getOrderDetail?orderNumber=${orderNumber}`, method: 'GET' },
        { url: `${baseUrl}/order/getOrderDetail`, method: 'POST', body: { orderNumber } },
    ];

    for (const v of variants) {
        console.log(`Testing ${v.method} ${v.url}...`);
        try {
            const res = await fetch(v.url, {
                method: v.method,
                headers,
                body: v.body ? JSON.stringify(v.body) : undefined
            });
            console.log(`Status: ${res.status}`);
            const data = await res.json();
            console.log(`Success: ${data.success}`);
            if (data.success && data.data) {
                console.log('DATA FOUND!');
                console.log('Items keys:', Object.keys(data.data.items || data.data.orderItems || data.data.orderItemDetails || {}));
                console.log('Sample item:', (data.data.items || data.data.orderItems || [])[0]);
                break;
            }
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

testEndpoints();
