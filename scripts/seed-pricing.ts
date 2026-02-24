
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting pricing migration...');

    // 1. Get all companies
    const companies = await prisma.company.findMany();

    for (const company of companies) {
        console.log(`Processing company: ${company.name} (${company.id})`);

        // 2. Ensure Price Lists exist
        const retailList = await prisma.priceList.upsert({
            where: { companyId_name: { companyId: company.id, name: 'Perakende (Retail)' } },
            create: { companyId: company.id, name: 'Perakende (Retail)', isDefault: true, isActive: true },
            update: {}
        });

        const wholesaleList = await prisma.priceList.upsert({
            where: { companyId_name: { companyId: company.id, name: 'Toptan (Wholesale)' } },
            create: { companyId: company.id, name: 'Toptan (Wholesale)', isDefault: false, isActive: true },
            update: {}
        });

        console.log(`- Price lists ensured: ${retailList.id} (Retail), ${wholesaleList.id} (Wholesale)`);

        // 3. Migrate existing product prices to Retail list
        const products = await prisma.product.findMany({
            where: { companyId: company.id }
        });

        let migratedCount = 0;
        for (const product of products) {
            // Check if price exists in ProductPrice for Retail
            const existing = await prisma.productPrice.findUnique({
                where: {
                    companyId_productId_priceListId: {
                        companyId: company.id,
                        productId: product.id,
                        priceListId: retailList.id
                    }
                }
            });

            if (!existing) {
                await prisma.productPrice.create({
                    data: {
                        companyId: company.id,
                        productId: product.id,
                        priceListId: retailList.id,
                        price: product.price,
                        isManualOverride: true // Treat migrated price as manual override initially
                    }
                });
                migratedCount++;
            }
        }
        console.log(`- Migrated prices for ${migratedCount} products.`);

        // 4. Ensure Categories
        const b2c = await prisma.customerCategory.upsert({
            where: { companyId_name: { companyId: company.id, name: 'Genel Müşteri (B2C)' } },
            create: { companyId: company.id, name: 'Genel Müşteri (B2C)', priceListId: retailList.id },
            update: { priceListId: retailList.id }
        });

        const b2b = await prisma.customerCategory.upsert({
            where: { companyId_name: { companyId: company.id, name: 'Toptancı (B2B)' } },
            create: { companyId: company.id, name: 'Toptancı (B2B)', priceListId: wholesaleList.id },
            update: { priceListId: wholesaleList.id }
        });

        console.log(`- Categories ensured.`);
    }

    console.log('Migration completed.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
