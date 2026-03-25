import * as dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI(); 

// Global Set for deduplicating identical exact paths (e.g. "Electronics > Computers").
const uniquePaths = new Set<string>();

// Global deduplication to prevent "Tablets" from appearing under "Computers", "Electronics", and "Office" simultaneously.
// We map the child name to its FIRST parent assignment.
const childToParentMap = new Map<string, string>();

const GENERIC_TERMS = [
  "accessories", "parts", "components", "cables", "cases", "covers", 
  "others", "miscellaneous", "sets", "kits", "hardware", "equipment", 
  "tools", "supplies", "chargers", "batteries", "adapters", "lighting",
  "storage", "bags", "mounts", "stands", "attachments", "replacement parts", "more"
];

function isGeneric(name: string): boolean {
  if (!name) return true;
  const norm = name.toLowerCase();
  for (const t of GENERIC_TERMS) {
    if (norm.includes(t) || norm === t) return true;
  }
  return false;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function run() {
  console.log("\n🚀 OTONOM AI KATEGORİ ENTEGRATÖRÜ BAŞLIYOR...");
  
  let wb;
  try {
    wb = xlsx.readFile("scripts/AmazonCategories.xlsx");
  } catch (err) {
    console.error("❌ Dosya okunamadı.");
    process.exit(1);
  }
  
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json<any>(ws);

  console.log("✂️ Yol Ağacı Çıkarılıyor (Sadece Ana Kategori -> Alt 1 -> Alt 2)...");

  for (const row of data) {
    // Only go up to depth 3 to avoid extreme 1980s fridge parts.
    const root = row["Mai Category"]?.trim();
    const sub1 = row["Subcategory 1"]?.trim();
    const sub2 = row["Subcategory 2"]?.trim();

    if (!root) continue;

    // RULE 1: ROOT
    uniquePaths.add(root);
    if (!isGeneric(root)) {
       childToParentMap.set(root.toLowerCase(), "ROOT");
    }
    
    // RULE 2: SUB 1
    if (sub1) {
       const s1norm = sub1.toLowerCase();
       if (!isGeneric(sub1) && childToParentMap.has(s1norm) && childToParentMap.get(s1norm) !== root) {
          // duplicate
       } else {
          childToParentMap.set(s1norm, root);
          uniquePaths.add(`${root} > ${sub1}`);
          
          // RULE 3: SUB 2
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
  
  console.log(`✅ Orijinal ağaçtan toplam ${paths.length} Adet Özelleşmiş/Tekilleştirilmiş Kategori Yolu Çıkarıldı.`);

  console.log("\n🤖 GPT-4o-mini Çevirisi Başlıyor (Batches of 100)...");
  
  const BATCH_SIZE = 100;
  const chunks = chunkArray(paths, BATCH_SIZE);
  const finalTranslatedPaths: string[][] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`   ⏳ Batch ${i + 1}/${chunks.length} Çevriliyor...`);
    
    const prompt = `Translate the EXACT following Amazon E-commerce Category Paths into highly professional Turkish (B2B E-commerce standard).
CRITICAL RULES:
1. You MUST return exactly ${chunk.length} lines. Each line corresponds to one translated path.
2. Maintain the " > " separator exactly as given.
3. Do NOT translate generic programming words. Translate "Home & Kitchen" to "Ev ve Yaşam", "Electronics" to "Elektronik", etc.
4. Output ONLY the translated strings separated by line breaks. Do not output anything else.

Paths to translate:
${chunk.join("\n")}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });

      const responseText = completion.choices[0].message.content || "";
      const translatedLines = responseText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      
      if (translatedLines.length === chunk.length) {
         for(let j=0; j<chunk.length; j++) {
            finalTranslatedPaths.push(translatedLines[j].split(" > ").map(x=>x.trim()));
         }
      } else {
         console.log(`   ⚠️ Uzunluk uyuşmazlığı (Beklenen: ${chunk.length}, Gelen: ${translatedLines.length}). Orijinalleri kullanılıyor...`);
         for(let j=0; j<chunk.length; j++) {
            finalTranslatedPaths.push(chunk[j].split(" > ").map(x=>x.trim()));
         }
      }
    } catch (err: any) {
      console.error(`   ❌ API Hatası: ${err.message}. Orijinalleri kullanılıyor...`);
      for(let j=0; j<chunk.length; j++) {
         finalTranslatedPaths.push(chunk[j].split(" > ").map(x=>x.trim()));
      }
    }
  }

  console.log("\n🧹 Eski Kategoriler (Bizim 400'lük test) Temizleniyor...");
  try {
    await prisma.categoryMapping.deleteMany();
    await prisma.globalCategory.deleteMany();
  } catch (e) {}

  console.log("🌳 Yeni Kategori Ağacı Veritabanına Yazılıyor...");
  
  const idCache = new Map<string, string>(); 
  finalTranslatedPaths.sort((a, b) => a.length - b.length);

  for (const nodePath of finalTranslatedPaths) {
    if (nodePath.length === 0 || !nodePath[0]) continue;

    const name = nodePath[nodePath.length - 1]; 
    const fullPathStr = nodePath.join(" > ");
    
    if (idCache.has(fullPathStr)) continue; 

    let parentId: string | null = null;

    if (nodePath.length > 1) {
      const parentPathStr = nodePath.slice(0, nodePath.length - 1).join(" > ");
      parentId = idCache.get(parentPathStr) || null;
      if (!parentId) continue;
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
  console.log(`\n🎉 BAŞARILI! ${finalCount} Adet Global Kategori, Mükerrerlerden Arındırılmış ve Türkçeleştirilmiş Olarak Sisteme Gönderildi!`);
  
  process.exit(0);
}

run();
