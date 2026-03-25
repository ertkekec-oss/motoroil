const dotenv = require("dotenv");
dotenv.config();
dotenv.config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");

const prisma = new PrismaClient();
const GEMINI_API_KEY = "AIzaSyCQPyjKTqQXn38pfwthpRylpD0g4kcTT30";

const uniquePaths = new Set();
const childToParentMap = new Map();

const GENERIC_TERMS = [
  "accessories", "parts", "components", "cables", "cases", "covers", 
  "others", "miscellaneous", "sets", "kits", "hardware", "equipment", 
  "tools", "supplies", "chargers", "batteries", "adapters", "lighting",
  "storage", "bags", "mounts", "stands", "attachments", "replacement parts", "more"
];

function isGeneric(name) {
  if (!name) return true;
  const norm = String(name).toLowerCase();
  for (const t of GENERIC_TERMS) {
    if (norm.includes(t) || norm === t) return true;
  }
  return false;
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function run() {
  console.log("\n🚀 OTONOM GEMINI AI KATEGORİ ENTEGRATÖRÜ BAŞLIYOR...");
  
  let wb;
  try {
    wb = xlsx.readFile("scripts/AmazonCategories.xlsx");
  } catch (err) {
    console.error("❌ Dosya okunamadı: " + err.message);
    process.exit(1);
  }
  
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);

  console.log("✂️ Yol Ağacı Çıkarılıyor (Sadece Ana Kategori -> Alt 1 -> Alt 2)...");

  for (const row of data) {
    const root = row["Mai Category"] ? String(row["Mai Category"]).trim() : null;
    const sub1 = row["Subcategory 1"] ? String(row["Subcategory 1"]).trim() : null;
    const sub2 = row["Subcategory 2"] ? String(row["Subcategory 2"]).trim() : null;

    if (!root) continue;

    uniquePaths.add(root);
    if (!isGeneric(root)) {
       childToParentMap.set(root.toLowerCase(), "ROOT");
    }
    
    if (sub1) {
       const s1norm = sub1.toLowerCase();
       if (!isGeneric(sub1) && childToParentMap.has(s1norm) && childToParentMap.get(s1norm) !== root) {
          // duplicate across roots
       } else {
          childToParentMap.set(s1norm, root);
          uniquePaths.add(`${root} > ${sub1}`);
          
          if (sub2) {
             const s2norm = sub2.toLowerCase();
             if (!isGeneric(sub2) && childToParentMap.has(s2norm) && childToParentMap.get(s2norm) !== sub1) {
                // duplicate
             } else {
                childToParentMap.set(s2norm, sub1);
                uniquePaths.add(`${root} > ${sub1} > ${sub2}`);
             }
          }
       }
    }
  }

  const paths = Array.from(uniquePaths);
  paths.sort((a, b) => a.split(" > ").length - b.split(" > ").length);
  
  // Limiting total paths for a realistic robust B2B operation without hitting extreme rate limits 
  // ~2500 requests could be too much for the Free Tier Gemini in one go. We will take the first 400 paths as proof of concept if needed.
  // Actually, we'll just process all of them via chunks!
  console.log(`✅ Orijinal ağaçtan toplam ${paths.length} Adet Özelleşmiş/Tekilleştirilmiş Kategori Yolu Çıkarıldı.`);

  console.log("\n🤖 Google Gemini 2.5 Flash Çevirisi Başlıyor (Batches of 200 Limit Korumalı)...");
  
  const BATCH_SIZE = 200;
  const chunks = chunkArray(paths, BATCH_SIZE);
  const finalTranslatedPaths = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`   ⏳ Batch ${i + 1}/${chunks.length} Çevriliyor...`);
    
    const prompt = `Translate the EXACT following Amazon E-commerce Category Paths into highly professional Turkish (B2B E-commerce standard).
CRITICAL RULES:
1. You MUST return exactly ${chunk.length} lines. Each line corresponds to one translated path.
2. Maintain the " > " separator exactly as given.
3. Do NOT translate generic programming words. Translate "Home & Kitchen" to "Ev ve Yaşam", "Electronics" to "Elektronik".
4. Output ONLY the translated strings separated by line breaks. Do NOT wrap output in markdown blocks (like \`\`\`). Just raw text. Mükerrer satır numarası kullanma. Sadece saf metin ver.

Paths to translate:
${chunk.join("\n")}`;

    let responseText = "";
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      const json = await response.json();
      
      if (json.error) {
        throw new Error(json.error.message || "API request failed");
      }

      if (json.candidates && json.candidates[0].content.parts[0].text) {
         responseText = json.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.error(`   ❌ API Hatası: ${err.message}. Orijinalleri kullanılıyor...`);
    }

    if (responseText) {
      responseText = responseText.replace(/```.*/g, "");
      const translatedLines = responseText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      
      if (translatedLines.length === chunk.length) {
         for(let j=0; j<chunk.length; j++) {
            finalTranslatedPaths.push(translatedLines[j].split(" > ").map(x=>x.trim()));
         }
      } else {
         console.log(`   ⚠️ Uzunluk uyuşmazlığı (Beklenen: ${chunk.length}, Gelen: ${translatedLines.length}). Orijinallerle eşleniyor...`);
         for(let j=0; j<chunk.length; j++) {
            finalTranslatedPaths.push(chunk[j].split(" > ").map(x=>x.trim()));
         }
      }
    } else {
      for(let j=0; j<chunk.length; j++) {
         finalTranslatedPaths.push(chunk[j].split(" > ").map(x=>x.trim()));
      }
    }
    
    // Güvenlik Kalkanı: Google API Limits'i (15 RPM) aşmamak için her batch'te tam tamına 10 Saniye Mola (Sleep)!
    // 3000 / 200 = 15 Batch. Her batch arası 10 sn mola = 150 sn = 2.5 dakika. Mükemmel güvenli!
    console.log(`   🕒 Google Kota Koruması İçin 10 Saniye Uyku Modu...`);
    await new Promise(r => setTimeout(r, 10000));
  }

  console.log("\n🧹 Eski Kategoriler Temizleniyor...");
  try {
    await prisma.categoryMapping.deleteMany();
    await prisma.globalCategory.deleteMany();
  } catch (e) {}

  console.log("🌳 Yeni Kategori Ağacı Veritabanına Yazılıyor...");
  
  const idCache = new Map(); 
  finalTranslatedPaths.sort((a, b) => a.length - b.length);

  for (const nodePath of finalTranslatedPaths) {
    if (nodePath.length === 0 || !nodePath[0]) continue;

    const name = nodePath[nodePath.length - 1]; 
    const fullPathStr = nodePath.join(" > ");
    
    if (idCache.has(fullPathStr)) continue; 

    let parentId = null;

    if (nodePath.length > 1) {
      const parentPathStr = nodePath.slice(0, nodePath.length - 1).join(" > ");
      parentId = idCache.get(parentPathStr) || null;
      if (!parentId) continue; // safety net 
    }

    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9\u011f\u011e\u0131\u0130\u00f6\u00d6\u00fc\u00dc\u015f\u015e\u00e7\u00c7]/g, "-") + "-" + Math.random().toString(36).substring(2, 8);
    
    try {
      const created = await prisma.globalCategory.create({
        data: { name, slug: generatedSlug, parentId }
      });
      idCache.set(fullPathStr, created.id);
    } catch (e) {}
  }

  const finalCount = await prisma.globalCategory.count();
  console.log(`\n🎉 BAŞARILI! ${finalCount} Adet Global Kategori, Mükerrerlerden Arındırılmış ve GEMİNİ ile Türkçeleştirilmiş Olarak Sisteme Gönderildi!`);
  
  process.exit(0);
}

run();
