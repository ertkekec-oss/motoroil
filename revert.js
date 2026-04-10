const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revert() {
    const twentyMinsAgo = new Date(Date.now() - 60 * 60000); // 1 hour ago
    const res = await prisma.product.updateMany({
        where: {
            updatedAt: { gt: twentyMinsAgo },
            globalCategoryId: { not: null }
        },
        data: {
            globalCategoryId: null,
            category: null
        }
    });
    console.log('Reverted count:', res.count);
    
    // Also delete the errant category mappings created in the last hour
    const errantMappings = await prisma.categoryMapping.deleteMany({
        where: { createdAt: { gt: twentyMinsAgo } }
    });
    console.log('Deleted mappings:', errantMappings.count);
    
    // Attempt to delete ERP categories created in the last hour
    const errantCategories = await prisma.eRPProductCategory.deleteMany({
         where: { createdAt: { gt: twentyMinsAgo } }
    });
    console.log('Deleted ERP Categories:', errantCategories.count);
}

revert().catch(console.error).finally(() => prisma.$disconnect());
