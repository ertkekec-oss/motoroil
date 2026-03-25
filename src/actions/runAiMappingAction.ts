"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export async function runAiMappingAction(updateLocalNames: boolean = false) {
    try {
        const session: any = await getSession();
        const user = session?.user || session;

        if (!user) return { success: false, error: "Unauthorized" };

        const companyId = user.companyId || session?.companyId;
        if (!companyId) return { success: false, error: "Company ID missing" };

        const unmappedProducts = await prisma.product.findMany({
            where: {
                companyId,
                OR: [{ category: null }, { category: "" }, { category: "-" }, { category: "Diğer" }, { globalCategoryId: null }]
            },
            take: 200 // Increased batch size for Gemini 2.5 Flash context capacity
        });

        if (unmappedProducts.length === 0) {
            return { success: true, message: "Tüm ürünleriniz zaten Global Ağa entegre edilmiştir." };
        }

        const globalCats = await prisma.globalCategory.findMany({
            include: { parent: { include: { parent: true } } }
        });

        const getFullName = (g: any) => {
            const parts = [g.name];
            let p = g.parent;
            while (p) {
                parts.unshift(p.name);
                p = p.parent;
            }
            return parts.join(" > ");
        };

        const globalCatList = globalCats.map(g => ({ id: g.id, path: getFullName(g) }));

        let processedCount = 0;

        // Semantic Engine Route with Google Gemini
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCQPyjKTqQXn38pfwthpRylpD0g4kcTT30";
        if (GEMINI_API_KEY) {
            
            const payload = unmappedProducts.map(p => ({
                id: p.id, name: p.name, brand: p.brand || "", category: p.category || ""
            }));

            const prompt = `Sen Periodya B2B ağının akıllı 'Otonom Semantic Motoru'sun.
Aşağıdaki 'LOKAL ÜRÜNLER' listesindeki ERP kayıtlarını analiz et. Her biri için 'GLOBAL KATEGORİ LİSTESİ'nden EN UYGUN kategorinin 'id'sini tespit et.
1. 'derivedBrand': 'brand' alanını profesyonelce düzelt.
2. 'seoTitle': B2B pazar yeri için ürüne mantıklı ve temizleştirilmiş bir isim üret.
3. Yanıtın KESİN formatta bir JSON objesi olmalıdır: { "results": [ { "id": "ürün-id-buraya", "globalCategoryId": "eşleşen-kategori-idsi", "derivedBrand": "Düzeltilmiş", "seoTitle": "SEO Başlığı" } ] }
Global dizin dışından id uydurma. Eşleşmiyorsa globalCategoryId'yi null bırak.

GLOBAL KATEGORİ LİSTESİ:
${JSON.stringify(globalCatList)}

LOKAL ÜRÜNLER:
${JSON.stringify(payload)}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
                })
            });

            const data = await response.json();
            const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"results":[]}';
            const parsed = JSON.parse(textResponse);
            
            for (const result of parsed.results) {
                const p = unmappedProducts.find(x => x.id === result.id);
                if (!p) continue;

                const finalGlobalId = result.globalCategoryId;
                let matchedCategoryName = p.category || "Diğer";

                // Ensure an ERP Category exists if matched
                if (finalGlobalId) {
                    const mappedGlobal = globalCats.find(g => g.id === finalGlobalId);
                    if (mappedGlobal) matchedCategoryName = mappedGlobal.name;
                    
                    let erpCategory = await prisma.eRPProductCategory.findFirst({
                        where: { sellerCompanyId: companyId, name: matchedCategoryName }
                    });

                    if (!erpCategory) {
                        erpCategory = await prisma.eRPProductCategory.create({
                            data: { sellerCompanyId: companyId, name: matchedCategoryName }
                        });
                    }

                    const existingMapping = await prisma.categoryMapping.findFirst({
                        where: { erpCategoryId: erpCategory.id, globalCategoryId: finalGlobalId }
                    });

                    if (!existingMapping) {
                        await prisma.categoryMapping.create({
                            data: {
                                erpCategory: { connect: { id: erpCategory.id } },
                                globalCategory: { connect: { id: finalGlobalId } },
                                company: { connect: { id: companyId } }
                            }
                        });
                    }
                }

                await prisma.product.update({
                    where: { id: p.id },
                    data: {
                        ...(updateLocalNames && result.seoTitle ? { name: result.seoTitle } : {}),
                        ...(updateLocalNames && matchedCategoryName !== "Diğer" ? { category: matchedCategoryName } : {}),
                        b2bDescription: result.seoTitle || p.name,
                        brand: result.derivedBrand || p.brand,
                        ...(finalGlobalId ? { globalCategoryId: finalGlobalId } : {})
                    }
                });
                processedCount++;
            }

        } else {
            // --- FALLBACK REGEX ENGINE (If no OpenAI API Key configured) ---
            for (const p of unmappedProducts) {
                const analysisString = `${String(p.name).toLowerCase()} ${String(p.brand || "").toLowerCase()} ${String(p.category || "").toLowerCase()}`;
                let matchedGlobalId = null;
                let matchedCatName = p.category || "Diğer"; 

                for (const gc of globalCats) {
                    const keywords = gc.name.toLowerCase().split(/[\s,&]+/).filter((w: string) => w.length > 3);
                    if (gc.name.toLowerCase().includes("bisiklet")) keywords.push(...["zefal", "jant", "kadro", "pedal"]);
                    if (gc.name.toLowerCase().includes("motosiklet")) keywords.push(...["zincir", "sprey", "yağ", "motul"]);

                    if (keywords.some((kw: string) => analysisString.includes(kw))) {
                        matchedGlobalId = gc.id;
                        matchedCatName = gc.name;
                        break;
                    }
                }

                if (matchedGlobalId) {
                    let erpCat = await prisma.eRPProductCategory.findFirst({
                        where: { sellerCompanyId: companyId, name: matchedCatName }
                    });

                    if (!erpCat) {
                        erpCat = await prisma.eRPProductCategory.create({
                            data: { sellerCompanyId: companyId, name: matchedCatName }
                        });
                    }

                    const existingMap = await prisma.categoryMapping.findFirst({
                        where: { erpCategoryId: erpCat.id, globalCategoryId: matchedGlobalId }
                    });

                    if (!existingMap) {
                        await prisma.categoryMapping.create({
                            data: {
                                erpCategory: { connect: { id: erpCat.id } },
                                globalCategory: { connect: { id: matchedGlobalId } },
                                company: { connect: { id: companyId } }
                            }
                        });
                    }
                }

                await prisma.product.update({
                    where: { id: p.id },
                    data: { 
                        ...(updateLocalNames && matchedCatName !== "Diğer" ? { category: matchedCatName } : {}),
                        ...(matchedGlobalId ? { globalCategoryId: matchedGlobalId } : {})
                    }
                });
                processedCount++;
            }
        }

        revalidatePath("/inventory");
        revalidatePath("/seller/categories");
        return { success: true, count: processedCount, message: GEMINI_API_KEY ? `${processedCount} ürün Gemini Semantik Vektörlerle B2B ağına çıkarıldı!` : `${processedCount} ürün Klasik Motorla tarandı ve bağlandı.` };

    } catch (e: any) {
        console.error("runAiMappingAction ERROR: ", e);
        return { success: false, error: e.message || "Eşleştirme sırasında hata oluştu." };
    }
}
