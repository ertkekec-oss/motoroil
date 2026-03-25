import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
    const products = await prisma.product.findMany({
        where: { category: { not: "" } },
        select: { id: true, category: true, companyId: true }
    });

    let updated = 0;
    for (const p of products) {
        if (!p.category) continue;
        const normalized = p.category.trim().toLocaleUpperCase('tr-TR');
        if (p.category !== normalized) {
            await prisma.product.update({
                where: { id: p.id },
                data: { category: normalized }
            });
            updated++;
        }
    }

    // Now clean up ERPProductCategory
    const erpCats = await prisma.eRPProductCategory.findMany();
    for (const ec of erpCats) {
        const normalized = ec.name.trim().toLocaleUpperCase('tr-TR');
        if (ec.name !== normalized) {
            try {
                // Remove lowercase variant entirely, system will recreate missing ones via page.tsx anyway
                await prisma.eRPProductCategory.delete({ where: { id: ec.id } });
                console.log("Deleted old lowercase mapping row:", ec.name);
            } catch (e) {
                console.log("Failed deleting", ec.name);
            }
        }
    }

    console.log(`Category unification completed. Updated ${updated} individual products!`);
    process.exit(0);
}

run();
