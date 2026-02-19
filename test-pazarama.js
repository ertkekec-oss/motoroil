const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpoints() {
    const companyId = 'cmlsmhyap000e8fcnemogl9hn';
    const orderNumber = '140301491';

    const config = await prisma.marketplaceConfig.findFirst({
        where: { companyId, type: 'pazarama' }
    });

    if (!config || !config.settings) {
        console.error('Config not found for pazarama');
        return;
    }

    const s = config.settings;
    const authString = Buffer.from(`${s.apiKey}:${s.apiSecret}`).toString('base64');

    // Auth first
    console.log('Fetching token...');
    const authRes = await fetch('https://isortagimgiris.pazarama.com/connect/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials&scope=merchantgatewayapi.fullaccess'
    });
    const authData = await authRes.json();
    const token = authData.access_token || authData.data?.access_token;

    if (!token) {
        console.error('Auth failed');
        return;
    }

    const baseUrl = 'https://isortagimapi.pazarama.com';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

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
            const text = await res.text();
            console.log(`Body (start): ${text.substring(0, 200)}`);
            try {
                const data = JSON.parse(text);
                if (data.success && data.data) {
                    console.log('✅ SUCCESS DATA FOUND!');
                    const items = data.data.items || data.data.orderItems || data.data.orderItemDetails || [];
                    console.log('Item count:', items.length);
                    if (items.length > 0) {
                        console.log('First item:', JSON.stringify(items[0], null, 2));
                    }
                }
            } catch (e) { }
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

testEndpoints()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
