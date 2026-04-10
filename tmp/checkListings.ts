import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const listings = await prisma.networkListing.findMany({
        where: {
            // Find all for this tenant
        },
        include: { globalProduct: true }
    });
    console.log(`Total listings found: ${listings.length}`);
    for (const l of listings) {
        console.log(`- Product: ${l.globalProduct?.name} | Status: ${l.status} | G.Status: ${l.globalProduct?.status} | Qty: ${l.availableQty}`);
    }
}

main().finally(() => prisma.$disconnect());
