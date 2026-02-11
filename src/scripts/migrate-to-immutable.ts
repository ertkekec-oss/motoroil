import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Starting Migration to Immutable Fintech Core...');

    const companies = await prisma.company.findMany();

    for (const company of companies) {
        console.log(`\n🏢 Processing Company: ${company.name} (${company.id})`);

        // 1. Migrate Inventory to FIFO Layers
        const products = await prisma.product.findMany({
            where: { companyId: company.id, stock: { gt: 0 } }
        });

        console.log(`📦 Found ${products.length} products with stock.`);

        for (const product of products) {
            // Create an INITIAL_STOCK_SYNC event
            const event = await prisma.domainEvent.create({
                data: {
                    companyId: company.id,
                    eventType: 'INITIAL_STOCK_SYNC',
                    aggregateType: 'INVENTORY',
                    aggregateId: product.id,
                    payload: {
                        name: product.name,
                        stock: product.stock,
                        cost: Number(product.buyPrice || 0)
                    },
                    metadata: { reason: 'Migration to Immutable Core' }
                }
            });

            // Create Inventory Layer
            await prisma.inventoryLayer.create({
                data: {
                    companyId: company.id,
                    productId: product.id,
                    sourceEventId: event.id,
                    quantityInitial: product.stock,
                    quantityRemaining: product.stock,
                    unitCost: product.buyPrice || 0,
                    createdAt: new Date()
                }
            });

            console.log(`   ✅ Migrated: ${product.name} (${product.stock} units @ ${product.buyPrice})`);
        }

        // 2. Migrate Pending Deliveries (Optional in demo)
    }

    console.log('\n✅ Migration completed successfully!');
}

migrate()
    .catch(e => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
