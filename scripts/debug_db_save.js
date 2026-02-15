const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSave() {
    // ... same code ...
    const companyId = 'cmlnn3tgb00011k8ry1in3b36'; // Periodya Platform
    const orderNumber = 'DEBUG-' + Date.now();
    const type = 'TRENDYOL';

    console.log(`Debug DB Save for Company: ${companyId}`);

    // Mock Order
    const order = {
        id: '999999',
        orderNumber: orderNumber,
        customerName: 'Debug Customer',
        customerEmail: 'debug@example.com',
        orderDate: new Date(),
        status: 'Created',
        totalAmount: 150.00,
        currency: 'TRY',
        shipmentPackageId: 'SP-DEBUG',
        shippingAddress: { fullName: 'Debug', address: 'Debug Addr', city: 'Ist', district: 'Sisli', phone: '555' },
        invoiceAddress: { fullName: 'Debug', address: 'Debug Addr', city: 'Ist', district: 'Sisli', phone: '555' },
        items: [
            { productName: 'Debug Product', sku: 'DEBUG-SKU', quantity: 1, price: 150.00, taxRate: 20, discountAmount: 0 }
        ]
    };

    try {
        // 1. Category Upsert
        console.log('Upserting Category...');
        const category = await prisma.customerCategory.upsert({
            where: { name: 'E-ticaret' },
            create: { name: 'E-ticaret', description: 'Debug' },
            update: { description: 'Debug Updated' }
        });
        console.log('Category ID:', category.id);

        // 2. Customer Upsert
        console.log('Upserting Customer...');
        // Note: Prisma expects specific structure for unique fields
        const customer = await prisma.customer.upsert({
            where: {
                email_companyId: {
                    email: order.customerEmail,
                    companyId: companyId
                }
            },
            create: {
                companyId: companyId,
                name: order.customerName,
                email: order.customerEmail,
                phone: order.invoiceAddress.phone,
                address: JSON.stringify(order.invoiceAddress),
                categoryId: category.id
            },
            update: {}
        });
        console.log('Customer ID:', customer.id);

        // 3. Order Create
        console.log('Creating Order...');
        const newOrder = await prisma.order.create({
            data: {
                companyId,
                marketplace: type,
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
                rawData: order
            }
        });
        console.log('SUCCESS: Order created:', newOrder.id);

    } catch (e) {
        console.error('FAILURE:', e);
    }
}

debugSave().catch(console.error).finally(() => prisma.$disconnect());
