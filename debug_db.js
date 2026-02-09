const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const productCount = await prisma.product.count();
    const stockCount = await prisma.stock.count();
    const stockMovementCount = await prisma.stockMovement.count();
    const companyCount = await prisma.company.count();

    console.log('Product Count:', productCount);
    console.log('Stock Count:', stockCount);
    console.log('StockMovement Count:', stockMovementCount);
    console.log('Company Count:', companyCount);

    const products = await prisma.product.findMany({
        take: 5,
        include: { stocks: true }
    });
    console.log('Sample Products:', JSON.stringify(products, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
