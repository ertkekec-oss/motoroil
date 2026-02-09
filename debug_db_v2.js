const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        include: { stocks: true }
    });

    console.log('Total Products:', products.length);
    products.forEach(p => {
        console.log(`Product: ${p.name}, ID: ${p.id}, CompanyId: ${p.companyId}, StockField: ${p.stock}, StocksRelationSum: ${p.stocks.reduce((acc, s) => acc + s.quantity, 0)}`);
    });

    const companies = await prisma.company.findMany();
    console.log('Companies:', companies.map(c => ({ id: c.id, name: c.name, tenantId: c.tenantId })));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
