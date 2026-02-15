const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
    // ... setup config ...
    const configRecord = await prisma.marketplaceConfig.findFirst({
        where: { type: 'trendyol' }
    }) || await prisma.marketplaceConfig.findFirst({
        where: { type: 'TRENDYOL' }
    });

    if (!configRecord) {
        fs.writeFileSync('error_log.txt', 'No config found');
        return;
    }

    const config = configRecord.settings;
    const companyId = configRecord.companyId;

    // ... fetch ...
    const baseUrl = config.isTest ? 'https://stageapi.trendyol.com/sapigw/suppliers' : 'https://api.trendyol.com/sapigw/suppliers';
    const authString = `${config.apiKey}:${config.apiSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    // Just fetch ONE order
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const startDate = oneWeekAgo.getTime();
    const endDate = Date.now();
    const url = `${baseUrl}/${config.supplierId}/orders?orderBy=CreatedDate&order=DESC&size=1&startDate=${startDate}&endDate=${endDate}`;

    let orders = [];
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': authHeader,
                'User-Agent': `${config.supplierId} - Periodya Debug`
            }
        });
        const data = await response.json();
        orders = data.content || [];
    } catch (e) {
        fs.writeFileSync('error_log.txt', `Fetch error: ${e.message}`);
        return;
    }

    if (orders.length === 0) {
        fs.writeFileSync('error_log.txt', 'No orders found');
        return;
    }

    const ptOrder = orders[0];

    // Map
    const order = {
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
        rawData: ptOrder // Validate this
    };

    try {
        // Category
        const category = await prisma.customerCategory.upsert({
            where: { name: 'E-ticaret' },
            create: { name: 'E-ticaret', description: 'Web Satış Kanalı' },
            update: {}
        });

        // Customer
        const customerEmail = order.customerEmail || `guest-${order.orderNumber}@trendyol.com`;
        const customer = await prisma.customer.upsert({
            where: { email_companyId: { email: customerEmail, companyId: companyId } },
            create: {
                companyId: companyId,
                name: order.customerName || 'Pazaryeri Müşterisi',
                email: customerEmail,
                phone: order.invoiceAddress?.phone || '',
                address: JSON.stringify(order.invoiceAddress),
                categoryId: category.id
            },
            update: {}
        });

        // Order
        // Check existence just in case script re-run (cleanup first?)
        // await prisma.order.deleteMany({ where: { orderNumber: order.orderNumber } });

        const existingOrder = await prisma.order.findFirst({
            where: { companyId, orderNumber: order.orderNumber }
        });

        if (!existingOrder) {
            await prisma.order.create({
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
            fs.writeFileSync('error_log.txt', 'SUCCESS');
        } else {
            fs.writeFileSync('error_log.txt', 'Order already exists');
        }

    } catch (e) {
        fs.writeFileSync('error_log.txt', `DB Error Detail: ${e.message}\nCode: ${e.code}\nMeta: ${JSON.stringify(e.meta)}`);
    }
}

run().catch(e => fs.writeFileSync('error_log.txt', `Fatal: ${e.message}`)).finally(() => prisma.$disconnect());
