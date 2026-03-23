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

        // Fetch products that don't have a category or are mapped to fallback "Diğer"
        const unmappedProducts = await prisma.product.findMany({
            where: {
                companyId,
                OR: [
                    { category: null },
                    { category: "" },
                    { category: "-" },
                    { category: "Diğer" },
                ]
            }
        });

        if (unmappedProducts.length === 0) {
            return { success: true, message: "Tüm ürünleriniz zaten kategorize edilmiş durumda." };
        }

        // Simulate AI Processing (NLP Keyword Vector matching Mock)
        let processedCount = 0;
        
        // Expanded dictionary heuristics for the mock AI
        const aiRules = [
            { keywords: ["zefal", "matara", "kafes", "çamurluk", "bisiklet", "xrs", "slcn", "totem", "prenses", "ilgaz", "nova", "flex", "wolf", "xr600", "xr-600", "ürgüp", "üsküp", "salcano", "jant", "kadro", "pedal", "sele"], targetCategory: "BİSİKLET" },
            { keywords: ["zincir", "sprey", "yağ", "motul", "motor", "fırça", "wings", "wind", "motosiklet", "scooter"], targetCategory: "MOTOSİKLET" },
            { keywords: ["kask", "çenesiz", "eldiven", "dizlik", "koruma"], targetCategory: "KASK & KORUMA EKİPMANLARI" },
            { keywords: ["far", "stop", "ampul", "led", "aydınlatma", "pilli"], targetCategory: "AYDINLATMA & ELEKTRONİK" },
            { keywords: ["kilit", "şifreli kilit", "spiral", "urba kilit", "vona", "auvray", "güvenlik"], targetCategory: "GÜVENLİK & KİLİT SİSTEMLERİ" }
        ];

        for (const product of unmappedProducts) {
            // Include brand in the analysis string so the "AI" sees it
            const analysisString = `${String(product.name).toLowerCase()} ${String(product.brand || "").toLowerCase()} ${String(product.code || "").toLowerCase()}`;
            let matchedCategory = product.category || "Diğer"; 
            let foundMatch = false;

            // Semantic string matching
            for (const rule of aiRules) {
                if (rule.keywords.some(kw => analysisString.includes(kw))) {
                    matchedCategory = rule.targetCategory;
                    foundMatch = true;
                    break;
                }
            }

            // If it was already "Diğer" and we couldn't find a better match, skip updating it
            if (!foundMatch && product.category === "Diğer") {
                continue;
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
