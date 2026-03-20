import "dotenv/config";
import { matchOrCreateGlobalProduct } from "../src/services/network/hubDeduplicationService";
import { prisma } from "../src/lib/prisma";

async function run() {
    console.log("-----------------------------------------");
    console.log("🧪 AI TEST: TAMAMEN YENİ VE TANINMAYAN ÜRÜN");
    console.log("-----------------------------------------");

    const obscureProduct = {
        name: "philips airfryer xxl beyaz 7 litre",
        description: "Az yağlı sıcak hava fritözü. Ev hediyesi sıfır kutu.",
        barcode: null,
    };
    
    console.log(`➡️  Satıcının Girdiği İsim: "${obscureProduct.name}"\n`);
    console.time("⚡ Hub PIM & AI Processing Time");

    try {
        const result = await matchOrCreateGlobalProduct(obscureProduct);
        console.timeEnd("⚡ Hub PIM & AI Processing Time");
        
        console.log("\n✅ AI İŞLEMİ ve EŞLEŞTİRME BAŞARILI");
        console.log("⚙️  Eşleştirme Modeli  :", result.method);
        console.log("🎯 Güven Skoru (Conf): %" + result.confidence);
        console.log("🏷️  Temizlenmiş AI İsmi:", result.globalProduct.name);
        console.log("📦 Master Kart ID    :", result.globalProduct.id);
        
        if (result.globalProduct.categoryId) {
            const cat = await prisma.globalCategory.findUnique({ where: { id: result.globalProduct.categoryId } });
            console.log(`📁 AI Tespit Ettiği Kategori: ${cat?.name || result.globalProduct.categoryId}`);
        } else {
            console.log(`📁 AI Alt Kategori Bulamadı`);
        }

    } catch(e) {
        console.error("Test Error:", e);
    }
    
    await prisma.$disconnect();
}

run();
