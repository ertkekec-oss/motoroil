"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function runAiMappingAction() {
    try {
        const session: any = await getSession();
        const user = session?.user || session;

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const companyId = user.companyId || session?.companyId;
        if (!companyId) {
            return { success: false, error: "Company ID missing" };
        }

        // Fetch products that don't have a category
        const unmappedProducts = await prisma.product.findMany({
            where: {
                companyId,
                OR: [
                    { category: null },
                    { category: "" },
                    { category: "-" },
                ]
            }
        });

        if (unmappedProducts.length === 0) {
            return { success: true, message: "Tüm ürünleriniz zaten kategorize edilmiş durumda." };
        }

        // Simulate AI Processing (NLP Keyword Vector matching Mock)
        let processedCount = 0;
        
        // Let's create an AI dictionary to classify based on keywords in name
        const aiRules = [
            { keywords: ["zefal", "matara", "kafes", "çamurluk", "bisiklet", "xrs"], targetCategory: "BİSİKLET" },
            { keywords: ["zincir", "sprey", "yağ", "motul", "motor", "fırça"], targetCategory: "Motosiklet" },
            { keywords: ["kask", "eldiven", "dizlik"], targetCategory: "Aksesuar" }
        ];

        for (const product of unmappedProducts) {
            const productName = String(product.name).toLowerCase();
            let matchedCategory = "Diğer"; // default fallback

            // Semantic string matching
            for (const rule of aiRules) {
                if (rule.keywords.some(kw => productName.includes(kw))) {
                    matchedCategory = rule.targetCategory;
                    break;
                }
            }

            // Update product in DB
            await prisma.product.update({
                where: { id: product.id },
                data: { category: matchedCategory }
            });

            // Also ensure ERPProductCategory exists so the Mapping Engine picks it up
            const existsEnp = await prisma.eRPProductCategory.findFirst({
                where: { sellerCompanyId: companyId, name: matchedCategory }
            });

            if (!existsEnp) {
                await prisma.eRPProductCategory.create({
                    data: {
                        sellerCompanyId: companyId,
                        name: matchedCategory
                    }
                });
            }

            processedCount++;
        }

        revalidatePath("/inventory");
        revalidatePath("/seller/categories");
        
        return { success: true, count: processedCount };

    } catch (e: any) {
        console.error("runAiMappingAction ERROR: ", e);
        return { success: false, error: e.message || "Eşleştirme sırasında hata oluştu." };
    }
}
