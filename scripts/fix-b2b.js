const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const orders = await prisma.order.findMany({
    where: { marketplace: 'B2B_NETWORK' }
  });

  console.log(`Found ${orders.length} B2B orders.`);

  for (const order of orders) {
    let customer = await prisma.customer.findFirst({
        where: {
            companyId: order.companyId,
            OR: [
                ...(order.customerEmail ? [{ email: order.customerEmail }] : []),
                { name: order.customerName }
            ]
        }
    });

    if (!customer) {
        console.log(`Creating customer for ${order.customerName}...`);
        customer = await prisma.customer.create({
            data: {
                companyId: order.companyId,
                name: order.customerName || 'B2B Müşterisi',
                email: order.customerEmail || '',
                phone: '',
                balance: 0
            }
        });
    }

    let rawData = {};
    if (order.rawData) {
        try { rawData = typeof order.rawData === 'string' ? JSON.parse(order.rawData) : order.rawData; } catch (e) {}
    }
    rawData.customerId = customer.id;

    await prisma.order.update({
        where: { id: order.id },
        data: {
            customerName: customer.name,
            customerEmail: customer.email,
            rawData: rawData
        }
    });

    console.log(`Linked Order ${order.orderNumber} to Customer ${customer.name}`);
  }
}

fix().then(() => { console.log('Done'); process.exit(0); });
