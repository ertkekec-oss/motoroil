import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const fetch = require("node-fetch");

async function run() {
    const unmappedProducts = await prisma.product.findMany({
        where: {
            OR: [{ category: null }, { category: "" }, { category: "-" }, { category: "Diğer" }, { globalCategoryId: null }]
        },
        take: 2 // Tiny payload for fast testing
    });

    console.log("Unmapped count in DB:", unmappedProducts.length);
    if(unmappedProducts.length === 0) return;

    const payload = unmappedProducts.map(p => ({
        id: p.id, name: p.name, brand: p.brand || "", category: p.category || ""
    }));

    const globalCats = await prisma.globalCategory.findMany({ take: 10 });
    const globalCatList = globalCats.map(g => ({ id: g.id, path: g.name }));

    const GEMINI_API_KEY = "AIzaSyCQPyjKTqQXn38pfwthpRylpD0g4kcTT30";
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

    console.log("Calling Gemini...");
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
    });
    const d = await r.json();
    console.log("GEMINI DATA: ", JSON.stringify(d, null, 2));
}
run();
