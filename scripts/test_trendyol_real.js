const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    // 1. Get Config
    const configRecord = await prisma.marketplaceConfig.findFirst({
        where: { type: 'trendyol' } // or 'TRENDYOL', try both or rely on my previous find
    }) || await prisma.marketplaceConfig.findFirst({
        where: { type: 'TRENDYOL' }
    });

    if (!configRecord) {
        console.error('No Trendyol config found!');
        return;
    }

    const config = configRecord.settings;
    const companyId = configRecord.companyId;
    console.log(`Using config for Company: ${companyId}`);
    console.log(`API Key: ${config.apiKey.substring(0, 5)}...`);

    // 2. Fetch Orders (Manual Implementation of TrendyolService)
    const baseUrl = config.isTest ? 'https://stageapi.trendyol.com/sapigw/suppliers' : 'https://api.trendyol.com/sapigw/suppliers';
    const authString = `${config.apiKey}:${config.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const startDate = oneWeekAgo.getTime();
    const endDate = Date.now();

    const url = `${baseUrl}/${config.supplierId}/orders?orderBy=CreatedDate&order=DESC&size=5&startDate=${startDate}&endDate=${endDate}`;

    console.log(`Fetching from: ${url}`);

    let orders = [];
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': authHeader,
                'User-Agent': `${config.supplierId} - Periodya Debug`
            }
        });

        if (!response.ok) {
            console.error('Trendyol API Error:', await response.text());
            return;
        }

        const data = await response.json();
        orders = data.content || [];
        console.log(`Fetched ${orders.length} orders.`);
    } catch (e) {
        console.error('Fetch error:', e);
        return;
    }

    if (orders.length === 0) return;

    // 3. Try to Save (Logic from route.ts)
    // Map first
    const mappedOrders = orders.map(ptOrder => ({
        id: ptOrder.id.toString(),
        orderNumber: ptOrder.orderNumber,
        customerName: `${ptOrder.customerFirstName} ${ptOrder.customerLastName}`,
        customerEmail: ptOrder.customerEmail,
        orderDate: new Date(ptOrder.orderDate),
        status: ptOrder.status,
        totalAmount: ptOrder.totalPrice,
        currency: ptOrder.currencyCode || 'TRY',
        shipmentPackageId: ptOrder.shipmentPackageId || ptOrder.packageId || ptOrder.lines?.[0]?.shipmentPackageId || null,
        shippingAddress: {
            fullName: `${ptOrder.shipmentAddress.firstName} ${ptOrder.shipmentAddress.lastName}`,
            address: ptOrder.shipmentAddress.fullAddress,
            city: ptOrder.shipmentAddress.city,
            district: ptOrder.shipmentAddress.district,
            phone: ptOrder.shipmentAddress.phone || ''
        },
        invoiceAddress: {
            fullName: `${ptOrder.invoiceAddress.firstName} ${ptOrder.invoiceAddress.lastName}`,
            address: ptOrder.invoiceAddress.fullAddress,
            city: ptOrder.invoiceAddress.city,
            district: ptOrder.invoiceAddress.district,
            phone: ptOrder.invoiceAddress.phone || ''
        },
        items: ptOrder.lines.map((line) => ({
            productName: line.productName,
            sku: line.merchantSku || line.sku,
            quantity: line.quantity,
            price: line.price,
            taxRate: line.vatBaseAmount ? (line.amount / line.vatBaseAmount) * 100 : 0
        })),
        rawData: ptOrder
    }));

    // Save
    for (const order of mappedOrders) {
        console.log(`Processing Order: ${order.orderNumber}`);
        try {
            // Category
            const category = await prisma.customerCategory.upsert({
                where: { name: 'E-ticaret' },
                create: { name: 'E-ticaret', description: 'Web Satış Kanalı' },
                update: {}
            });
            const categoryId = category.id;

            // Customer
            const customerEmail = order.customerEmail || `guest-${order.orderNumber}@trendyol.com`;
            let customer;
            // First try verify if email exists with different case? No, Prisma is case sensitive usually but let's stick to logic
            // Check if customer exists first to debug
            const existingCust = await prisma.customer.findFirst({
                where: { email: customerEmail, companyId: companyId }
            });
            console.log(`Existing Customer: ${existingCust ? existingCust.id : 'None'}`);

            customer = await prisma.customer.upsert({
                where: { email_companyId: { email: customerEmail, companyId: companyId } },
                create: {
                    companyId: companyId,
                    name: order.customerName || 'Pazaryeri Müşterisi',
                    email: customerEmail,
                    phone: order.invoiceAddress?.phone || '',
                    address: JSON.stringify(order.invoiceAddress),
                    categoryId: categoryId
                },
                update: {}
            });
            console.log(`Customer Upserted: ${customer.id}`);

            // Order
            const existingOrder = await prisma.order.findFirst({
                where: { companyId, orderNumber: order.orderNumber }
            });

            if (!existingOrder) {
                console.log('Creating new order...');
                const newOrder = await prisma.order.create({
                    data: {
                        companyId,
                        marketplace: 'TRENDYOL',
                        marketplaceId: order.id,
                        orderNumber: order.orderNumber,
                        customerName: customer.name,
                        totalAmount: order.totalAmount,
                        currency: order.currency,
                        status: order.status,
                        orderDate: order.orderDate,
                        items: order.items,
                        shippingAddress: order.shippingAddress,
                        invoiceAddress: order.invoiceAddress,
                        shipmentPackageId: order.shipmentPackageId,
                        rawData: order.rawData
                    }
                });
                console.log(`Order Created: ${newOrder.id}`);
            } else {
                console.log(`Order Exists: ${existingOrder.id}`);
            }

        } catch (e) {
            console.error(`ERROR processing order ${order.orderNumber}:`, e);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
