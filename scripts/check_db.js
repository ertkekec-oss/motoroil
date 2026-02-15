const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("--- DB Health Check ---");
    const orderCount = await prisma.order.count();
    console.log("Total Orders in DB:", orderCount);

    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { company: true }
    });

    console.log("Last 5 Orders:");
    orders.forEach(o => {
        console.log(`- ID: ${o.id}, Number: ${o.orderNumber}, Marketplace: ${o.marketplace}, CompanyId: ${o.companyId}, TenantId: ${o.company?.tenantId}, Status: ${o.status}`);
    });

    const companies = await prisma.company.findMany();
    console.log("Total Companies:", companies.length);
    companies.forEach(c => {
        console.log(`- Company: ${c.name}, ID: ${c.id}, TenantId: ${c.tenantId}`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
