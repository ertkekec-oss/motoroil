const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        include: { stocks: true }
    });

    console.log('Total Products:', products.length);
    products.forEach(p => {
        const totalStock = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
        console.log(`Product: ${p.name.padEnd(20)} | LegacyStock: ${String(p.stock).padEnd(5)} | MultiBranchStock: ${String(totalStock).padEnd(5)} | CompanyId: ${p.companyId}`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
