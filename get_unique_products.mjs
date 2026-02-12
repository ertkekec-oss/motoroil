import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        select: { items: true, marketplace: true }
    });

    const uniqueProducts = new Map();

    for (const order of orders) {
        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
            const key = `${order.marketplace}-${item.sku}`;
            if (!uniqueProducts.has(key)) {
                uniqueProducts.set(key, {
                    marketplace: order.marketplace,
                    sku: item.sku,
                    productName: item.productName,
                    price: item.price
                });
            }
        }
    }

    console.log('UNIQUE_PRODUCTS_START');
    console.log(JSON.stringify(Array.from(uniqueProducts.values()), null, 2));
    console.log('UNIQUE_PRODUCTS_END');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
