import { PrismaClient } from '@prisma/client';
import { uploadToS3, getPublicObjectUrl } from '../src/lib/s3';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 S3 -> DB Full Flow Testi Başlıyor (Sunucu-İçi Simülasyon)...");
    try {
        const user = await prisma.user.findFirst({
            where: { email: 'admin@periodya.com' }
        });

        const company = await prisma.company.findFirst({
            where: { tenantId: user?.tenantId }
        });

        if (!user || !company) {
            throw new Error("Kullanıcı veya şirket bulunamadı, db boş olabilir.");
        }

        console.log(`👤 Auth Context: Tenant=${user.tenantId}, Company=${company.id}`);

        let product = await prisma.product.findFirst({
            where: { code: 'TEST-S3-001' }
        });

        if (!product) {
            product = await prisma.product.findFirst({ where: { companyId: company.id } });
        }

        if (!product) {
            throw new Error("Test edebilmek için ürün bulunamadı!");
        }

        console.log(`📦 Hedef Ürün: ${product.name} (ID: ${product.id})`);

        // 1. Generate S3 Key just like the route
        const tenantId = company.id;
        const productId = product.id;
        const s3Key = `tenants/${tenantId}/products/${productId}/${randomUUID()}-backend-test.jpg`;

        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAXSURBVBhXY3jP8P8/AwgwwIQxEAADIAAAqAQE+06vngAAAABJRU5ErkJggg==";
        const buffer = Buffer.from(base64Image, 'base64');

        console.log(`🌐 AWS S3 Yüklemesi Başlatılıyor... (${s3Key})`);

        // 2. Upload to S3
        await uploadToS3({
            bucket: 'public',
            key: s3Key,
            body: buffer,
            contentType: 'image/jpeg',
            cacheControl: "public, max-age=31536000, immutable"
        });

        const imageUrl = getPublicObjectUrl(s3Key);
        console.log("✅ AWS S3 Upload Başarılı URL:", imageUrl);

        console.log(`💾 Veritabanı Prisma Güncellemesi Atılıyor...`);

        // 3. Update DB
        const updateResult = await prisma.product.updateMany({
            where: {
                id: productId,
                companyId: tenantId
            },
            data: {
                imageKey: s3Key,
                imageUrl: imageUrl
            }
        });

        if (updateResult.count === 0) {
            throw new Error("Prisma update yapamadı, id/companyId hatası olabilir.");
        }

        // 4. Verify DB
        const updatedProduct = await prisma.product.findUnique({
            where: { id: product.id }
        });

        console.log("\n📊 Veritabanı (Prisma) Güncelleme Sonucu:");
        console.log(`   - Güncellenen imageKey: ${updatedProduct?.imageKey}`);
        console.log(`   - Güncellenen imageUrl: ${updatedProduct?.imageUrl}`);

        if (updatedProduct?.imageKey === s3Key) {
            console.log("\n🏆 MUHTEŞEM! Modülü başarıyla hackledik ve otomatize ettik!");
            console.log("\n👉 Lütfen arayüzde 'S3 Test Ürünü' isimli ürünü arayıp, Düzenle'ye tıkla. Görseli Modalda göreceksin!");
        } else {
            console.log("\n❌ Veritabanı kaydı beklendiği gibi güncellenmemiş!");
        }

    } catch (e) {
        console.error("❌ Test Başarısız:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
