import { prisma } from "@/lib/prisma";
import { normalizeString, tokenizeString, jaccardSimilarity } from "@/lib/utils/matching";
import { getOpenAiCategoryMapping } from "./aiService";

/**
 * MAPPINGS & DEDUPLICATION ENGINE (Periodya Hub)
 * Returns a matched GlobalProduct or Creates a new one intelligently.
 */
export async function matchOrCreateGlobalProduct(erpProduct: any, autoApprove: boolean = true): Promise<{ globalProduct: any, confidence: number, method: string }> {

    // 1. FAZ: BARKOD KESİN EŞLEŞTİRME (Sıfır Maliyet, Kusursuz Eşleşme)
    if (erpProduct.barcode && erpProduct.barcode.length >= 8) {
        const existingByBarcode = await prisma.globalProduct.findFirst({
            where: { barcode: erpProduct.barcode }
        });
        
        if (existingByBarcode) {
            return { globalProduct: existingByBarcode, confidence: 100, method: "BARCODE" };
        }
    }

    // 2. FAZ: VERİTABANI İÇİ KELİME BENZERLİĞİ (Fuzzy Search / Jaccard Overlap)
    // AI fatura yakmadan önce yerel veritabanında benzer isimli ürün arıyoruz.
    const normalizedTarget = normalizeString(erpProduct.name);
    const targetTokens = tokenizeString(normalizedTarget);

    const candidates = await prisma.globalProduct.findMany({
        where: {
            OR: targetTokens.map(t => ({
                name: { contains: t, mode: 'insensitive' }
            }))
        },
        take: 10
    });

    let bestMatch = null;
    let highestScore = 0;

    for (const candidate of candidates) {
        const candidateTokens = tokenizeString(normalizeString(candidate.name));
        const score = jaccardSimilarity(targetTokens, candidateTokens);
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = candidate;
        }
    }

    // Eğer %90 üzeri eşleşme varsa, bu üründür diyoruz! (Örn: "iPhone 15 Mavi" && "Apple iPhone 15 Mavi")
    if (bestMatch && highestScore >= 0.90) {
        return { globalProduct: bestMatch, confidence: highestScore * 100, method: "FUZZY_TEXT" };
    }

    // 3. FAZ: YAPAY ZEKA (AI) DESTEKLİ KATEGORİZASYON VE BENZERLİK 
    // Eğer hiçbir şey bulunamadıysa (Yeni bir ürünse), OpenAI devreye girer.
    // 1. AI'den bu ürünün PIM özelliklerini (Kategori, Marka) çıkartmasını isteriz.
    let aiExtractedCategory = null;
    let aiExtractedBrand = null;
    
    // AI Çalıştırması (Eğer apiKey varsa çalışır, yoksa atlar - hata patlatmaz)
    let finalTitle = erpProduct.name;
    try {
        const aiResult = await getOpenAiCategoryMapping(erpProduct.name, erpProduct.description);
        if (aiResult) {
            aiExtractedCategory = aiResult.globalCategoryId;
            aiExtractedBrand = aiResult.brand;
            finalTitle = aiResult.cleanTitle || erpProduct.name;
        }
    } catch(e) {
        console.error("[HubDeduplicator] AI Extract Error: ", e);
    }

    // Hem Veritabanında eşleşmedi, hem barkodu yok. YEPYENİ bir Global Kart oluşturuyoruz!
    const newGlobalProduct = await prisma.globalProduct.create({
        data: {
            name: finalTitle, // AI cleans this up (e.g. "iPhone 15 128GB")
            barcode: erpProduct.barcode || null,
            description: erpProduct.description || null,
            categoryId: aiExtractedCategory || erpProduct.globalCategoryId || null,
            // e.g. brand: aiExtractedBrand // (if `brand` is added to schema)
        }
    });

    return { globalProduct: newGlobalProduct, confidence: 100, method: "AI_NEW_CARD" };
}
