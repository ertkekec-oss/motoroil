"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function runAiMappingAction(updateLocalNames: boolean = false) {
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

        // Fetch all REAL Global Categories from the Database
        const globalCats = await prisma.globalCategory.findMany();
        
        let processedCount = 0;

        for (const product of unmappedProducts) {
            const analysisString = `${String(product.name).toLowerCase()} ${String(product.brand || "").toLowerCase()} ${String(product.code || "").toLowerCase()}`;
            let matchedGlobalId = null;
            let matchedCategoryName = product.category || "Diğer"; 
            let foundMatch = false;

            // Simple semantic matcher against actual Database Global Categories
            for (const gc of globalCats) {
                // Extract searchable literal words from global category name
                const keywords = gc.name.toLowerCase().split(/[\s,&]+/).filter((w: string) => w.length > 3);
                
                // Add specific extra hints if we recognize standard names natively
                if (gc.name.toLowerCase().includes("aydınlatma")) keywords.push(...["far", "stop", "ampul", "led", "pilli"]);
                if (gc.name.toLowerCase().includes("kilit")) keywords.push(...["şifreli", "spiral", "urba", "güvenlik"]);
                if (gc.name.toLowerCase().includes("bisiklet")) keywords.push(...["zefal", "matara", "kafes", "çamurluk", "xrs", "slcn", "totem", "prenses", "ilgaz", "nova", "salcano", "jant", "kadro", "pedal"]);
                if (gc.name.toLowerCase().includes("motosiklet")) keywords.push(...["zincir", "sprey", "yağ", "motul", "motor", "scooter"]);
                if (gc.name.toLowerCase().includes("kask")) keywords.push(...["çenesiz", "eldiven", "dizlik", "koruma"]);

                if (keywords.some((kw: string) => analysisString.includes(kw))) {
                    matchedCategoryName = gc.name; // Use the exact Global Category name
                    matchedGlobalId = gc.id;
                    foundMatch = true;
                    break;
                }
            }

            // If it was already "Diğer" and we couldn't find a better match, skip updating it
            if (!foundMatch && product.category === "Diğer") {
                continue;
            }

            // Find or create the ERPProductCategory representing this name locally
            let erpCategory = await prisma.eRPProductCategory.findFirst({
                where: { sellerCompanyId: companyId, name: matchedCategoryName },
                include: { mappings: true }
            });

            if (!erpCategory) {
                erpCategory = await prisma.eRPProductCategory.create({
                    data: {
                        sellerCompanyId: companyId,
                        name: matchedCategoryName
                    },
                    include: { mappings: true }
                });
            }

            // If we found a Global Match via AI, and the ERP category isn't mapped to it yet, link it now!
            if (matchedGlobalId && erpCategory.mappings.length === 0) {
                await prisma.categoryMapping.create({
                    data: {
                        erpCategoryId: erpCategory.id,
                        globalCategoryId: matchedGlobalId,
                        companyId: companyId
                    }
                });
            }

            // The absolute mapped global ID to inject
            const finalGlobalId = erpCategory.mappings.length > 0 ? erpCategory.mappings[0].globalCategoryId : matchedGlobalId;

            // Update product in DB
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    ...(updateLocalNames && matchedCategoryName !== "Diğer" ? { category: matchedCategoryName } : {}),
                    ...(finalGlobalId ? { globalCategoryId: finalGlobalId } : {})
                }
            });

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
