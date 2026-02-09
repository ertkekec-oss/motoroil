const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true, companyId: true, stock: true }
    });
    console.log('Products:', JSON.stringify(products, null, 2));

    const companies = await prisma.company.findMany({
        select: { id: true, name: true, tenantId: true }
    });
    console.log('Companies:', JSON.stringify(companies, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
