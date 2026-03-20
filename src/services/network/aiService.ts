import { prisma } from "@/lib/prisma";
import { normalizeString, tokenizeString, jaccardSimilarity } from "@/lib/utils/matching";

interface AiExtractionResult {
    globalCategoryId: string | null;
    brand: string | null;
    cleanTitle: string;
}

export async function getOpenAiCategoryMapping(productName: string, description?: string): Promise<AiExtractionResult | null> {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openaiKey && !geminiKey) {
        console.warn("[HubDeduplicator] AI API keys missing. Skipping AI categorization.");
        return null;
    }

    const payloadText = `Ürün Adı: ${productName} \nAçıklama: ${description || "Yok"}`;
    const systemPrompt = `Sen profesyonel bir B2B PIM (Ürün Bilgi Yönetimi) motorusun. Gelen ürün adını ve içeriğini analiz et. 
Senden SADECE saf bir JSON objesi bekliyorum (başka hiçbir metin veya markdown satırı yazma).
Döndüreceğin JSON formatı TAM OLARAK şu olmalı:
\`\`\`json
{
  "categoryName": "Ana kategori ismini değil, en spesifik alt kategori ismini bul (Örn: Spor, Telefon Aksesuarı, Akıllı Saat)",
  "brand": "Bulabildiysen markası, yoksa null",
  "cleanTitle": "Eğer isim çok kirli veya SEO uyumsuz ise baş harfleri büyük pürüzsüz düzeltilmiş bir ürün başlığı"
}
\`\`\`
Sadece JSON çıktısı ver.`;

    let extractedData: any = null;

    try {
        if (openaiKey) {
            // OpenAI (gpt-4o-mini)
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: payloadText }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.1
                })
            });

            const rawData = await response.json();
            if (rawData.choices?.[0]?.message?.content) {
                extractedData = JSON.parse(rawData.choices[0].message.content);
            }
        } else if (geminiKey) {
            // Google Gemini (gemini-1.5-flash)
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generationConfig: {
                        responseMimeType: "application/json"
                    },
                    contents: [
                        { parts: [{ text: systemPrompt + "\n\n" + payloadText }] }
                    ]
                })
            });

            const rawData = await response.json();
            if (rawData.candidates?.[0]?.content?.parts?.[0]?.text) {
                const textOutput = rawData.candidates[0].content.parts[0].text;
                const jsonStr = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
                extractedData = JSON.parse(jsonStr);
            } else {
                console.error("Gemini raw response:", rawData);
            }
        }

        if (!extractedData) return null;

        let dbCategoryId = null;

        // "categoryName" kullanarak veritabanımızdaki GlobalCategory'i bulalım (En basit Jaccard/Kesişim benzerliği)
        if (extractedData.categoryName) {
            const aiTokens = tokenizeString(extractedData.categoryName);
            const candidates = await prisma.globalCategory.findMany({
                where: {
                    OR: aiTokens.map(t => ({ name: { contains: t, mode: 'insensitive' } }))
                },
                take: 15
            });

            let bestMatch = null;
            let highestScore = 0;
            
            for (const cat of candidates) {
                const catTokens = tokenizeString(cat.name);
                const score = jaccardSimilarity(aiTokens, catTokens);
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = cat;
                }
            }

            // Düşük bir eşik koyduk (%50) çünkü AI "Akıllı Saatler" dedi, db'de "Akıllı Saat" olabilir.
            if (bestMatch && highestScore >= 0.40) {
                dbCategoryId = bestMatch.id;
            }
        }

        return {
            globalCategoryId: dbCategoryId,
            brand: extractedData.brand || null,
            cleanTitle: extractedData.cleanTitle || productName // Fallback to raw if logic fails
        };

    } catch (e: any) {
        console.error("[AiService] PIM Extraction Error:", e.message);
        return null;
    }
}
