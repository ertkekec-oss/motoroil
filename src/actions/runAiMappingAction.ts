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

            // --- 2. ATTRIBUTE EXTRACTION ENGINE (NLP/Regex Mock) ---
            // If the name contains standard sizes (S, M, L, XL, XXL) or numeric inches
            const sizeMatch = analysisString.match(/\b(xxs|xs|s|m|l|xl|xxl|3xl|4xl|[0-9]{2}\s?(numara|jant|inch|inç))\b/i);
            const extractedSize = sizeMatch ? sizeMatch[0].toUpperCase() : null;
            
            // Common colors
            const colors = ["siyah", "beyaz", "kırmızı", "mavi", "yeşil", "sarı", "gri", "antrasit", "şeffaf", "mat"];
            const extractedColor = colors.find(c => analysisString.includes(c)) || null;

            // Brand auto-correction dictionary (Data Cleansing for common typos)
            const brandCorrections: Record<string, string> = {
                "snmsng": "Samsung", "samsng": "Samsung", "nln": "Nolan", 
                "slcn": "Salcano", "michelin": "Michelin", "motl": "Motul",
                "ls2": "LS2", "zfl": "Zefal"
            };
            let derivedBrand = product.brand;
            for (const [typo, correct] of Object.entries(brandCorrections)) {
                if (analysisString.includes(typo)) {
                    derivedBrand = correct;
                    break;
                }
            }

            // --- 3. SEO DATA CLEANSING (Vitrin İsmi Yenileme) ---
            // Reconstruct a beautiful B2B title: [Brand] [Product Root] [Attributes] [Category Path]
            const cleanCategoryWord = matchedCategoryName !== "Diğer" ? matchedCategoryName.split('>').pop()?.trim() : "";
            
            // Minimal mock logic to build a clean title string
            const seoTitleParts = [
                derivedBrand || "", 
                cleanCategoryWord,
                extractedColor ? `(${extractedColor.charAt(0).toUpperCase() + extractedColor.slice(1)})` : "",
                extractedSize ? `[${extractedSize}]` : ""
            ].filter(Boolean);

            const seoVitrinName = seoTitleParts.length > 1 ? seoTitleParts.join(" ") : product.name;

            // --- DB TRANSACTIONS ---

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
            const existingTags = product.tags ? String(product.tags).split(',').map(t=>t.trim()) : [];
            const newTags = new Set([...existingTags, extractedColor, extractedSize].filter(Boolean));
            
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    ...(updateLocalNames && matchedCategoryName !== "Diğer" ? { category: matchedCategoryName } : {}),
                    ...(updateLocalNames && seoTitleParts.length > 1 ? { name: seoVitrinName } : {}),
                    brand: derivedBrand,
                    b2bDescription: seoVitrinName,
                    tags: Array.from(newTags).join(", "),
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
