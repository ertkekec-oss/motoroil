import "dotenv/config";
import { matchOrCreateGlobalProduct } from "../src/services/network/hubDeduplicationService";
import { prisma } from "../src/lib/prisma";

async function run() {
    console.log("-----------------------------------------");
    console.log("🧪 PERIODYA HUB DEDUPLICATION ENGINE TEST");
    console.log("-----------------------------------------");

    console.log("\n[TEST 1] Barkod Yok & Kötü Başlık ile Ürün Gönderme:");
    const PIMProduct = {
        name: "xiaomi mi band akıllı bileklik",
        description: "Adımsayar sağlık saat siyah",
        barcode: null,
    };
    
    console.log(`➡️  Satıcının Girdiği İsim: "${PIMProduct.name}"\n`);
    console.time("⚡ Hub PIM & AI Processing Time");

    try {
        const result = await matchOrCreateGlobalProduct(PIMProduct);
        console.timeEnd("⚡ Hub PIM & AI Processing Time");
        
        console.log("\n✅ EŞLEŞTİRME BAŞARILI");
        console.log("⚙️  Eşleştirme Modeli  :", result.method);
        console.log("🎯 Güven Skoru (Conf): %" + result.confidence);
        console.log("🏷️  Yeni Global İsmi   :", result.globalProduct.name);
        console.log("📦 Master Kart ID    :", result.globalProduct.id);
        
        if (result.globalProduct.categoryId) {
            const cat = await prisma.globalCategory.findUnique({ where: { id: result.globalProduct.categoryId } });
            console.log(`📁 Atanan Kategori   : ${cat?.name || result.globalProduct.categoryId}`);
        } else {
            console.log(`📁 Atanan Kategori   : (AI Alt Kategori Bulamadı)`);
        }

    } catch(e) {
        console.error("Test Error:", e);
    }
    
    await prisma.$disconnect();
}

run();
