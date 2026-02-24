import prisma from '../src/lib/prisma';

async function main() {
    const company = await prisma.company.findFirst();
    const customer = await prisma.customer.findFirst({ where: { companyId: company?.id } });
    const products = await prisma.product.findMany({
        where: { companyId: company?.id },
        take: 5
    });

    console.log(JSON.stringify({
        companyId: company?.id,
        customerId: customer?.id,
        products: products.map(p => ({ id: p.id, name: p.name, price: p.price }))
    }, null, 2));
}

main().catch(console.error);
