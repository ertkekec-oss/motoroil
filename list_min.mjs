import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        select: { items: true, marketplace: true }
    });

    const products = [];
    for (const order of orders) {
        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
            products.push({
                title: item.productName,
                barcode: item.sku,
                price: item.price,
                marketplace: order.marketplace
            });
        }
    }

    // Remove duplicates
    const unique = Array.from(new Map(products.map(p => [`${p.marketplace}-${p.barcode}`, p])).values());

    console.log(JSON.stringify(unique));
}

main().finally(() => prisma.$disconnect());
