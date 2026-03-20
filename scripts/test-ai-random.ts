import "dotenv/config";
import { matchOrCreateGlobalProduct } from "../src/services/network/hubDeduplicationService";
import { prisma } from "../src/lib/prisma";

async function run() {
    const rawProductId = Math.random().toString(36).substring(7);
    const obscureProduct = {
        name: `Sony P23 Oyuncu Kulaklığı ${rawProductId}`,
        description: "Stereo Bass Bluetooth Kulaküstü",
        barcode: null,
    };
    
    console.log(`➡️  İsim: "${obscureProduct.name}"`);
    console.time("⚡ Hub PIM & AI Processing Time");

    try {
        const result = await matchOrCreateGlobalProduct(obscureProduct);
        console.timeEnd("⚡ Hub PIM & AI Processing Time");
        
        console.log("\n✅ BAŞARILI");
        console.log("⚙️  Model:", result.method);
        console.log("🏷️  Temiz İsim:", result.globalProduct.name);
        
        if (result.globalProduct.categoryId) {
            const cat = await prisma.globalCategory.findUnique({ where: { id: result.globalProduct.categoryId } });
            console.log(`📁 AI Kategori: ${cat?.name || result.globalProduct.categoryId}`);
        } else {
            console.log(`📁 AI Kategori Bulamadı`);
        }

    } catch(e) {
        console.error("Test Error:", e);
    }
    
    await prisma.$disconnect();
}

run();
