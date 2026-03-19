const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// const { GoogleGenerativeAI } = require('@google/generative-ai'); // You can use this for Gemini Integration later

async function run() {
    console.log('[AI_CATEGORIZER] Starting background job...');
    try {
        const unassignedProducts = await prisma.product.findMany({
            where: {
                globalCategoryId: null,
                deletedAt: null
            },
            take: 100 // Process in chunks
        });

        if (unassignedProducts.length === 0) {
            console.log('[AI_CATEGORIZER] No products need categorization.');
            return;
        }

        console.log(`[AI_CATEGORIZER] Found ${unassignedProducts.length} unassigned products. Loading Global Categories...`);
        const globalCategories = await prisma.globalCategory.findMany({
            select: { id: true, name: true, slug: true, parentId: true }
        });

        // Simulating an AI Matching Engine or heuristics.
        for (const product of unassignedProducts) {
            console.log(`[AI_CATEGORIZER] Processing [${product.code}] ${product.name}...`);
            
            // Basic heuristic fallback: Match by brand, name or old category field
            // Here you would call an LLM with product.name, product.type, product.brand and the globalCategories list
            const searchStr = `${product.name} ${product.category || ''}`.toLowerCase();
            let matchedCatId = null;

            const targetKeywords = {
                'oto': 'Oto', 'motor': 'Motor', 'bilgisayar': 'Bilgisayar', 'laptop': 'Dizüstü', 'lastik': 'Oto Lastik', 'telefon': 'Akıllı Telefon'
            };

            for (const [kw, catName] of Object.entries(targetKeywords)) {
                if (searchStr.includes(kw)) {
                    const cat = globalCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
                    if (cat) {
                        matchedCatId = cat.id;
                        break;
                    }
                }
            }
            
            // If still no match, assign to a generic category like 'Otomotiv' or leave as fallback.
            // For now, if match found, update
            if (matchedCatId) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { globalCategoryId: matchedCatId }
                });
                console.log(` -> Matched with category ID: ${matchedCatId}`);
            } else {
                console.log(` -> No confident AI match. Retrying next batch.`);
            }
        }
    } catch (e) {
        console.error('[AI_CATEGORIZER] Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
