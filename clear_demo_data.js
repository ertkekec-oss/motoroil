
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Demo verileri temizleme işlemi başlatılıyor...');

    try {
        // 1. İşlemleri ve Faturaları temizle (Foreign key bağımlılıkları nedeniyle önce bunlar)
        console.log('🗑️  İşlemler ve faturalar siliniyor...');
        await prisma.transaction.deleteMany({});
        await prisma.salesInvoice.deleteMany({});
        await prisma.purchaseInvoice.deleteMany({});
        await prisma.order.deleteMany({});

        // 2. Carileri ve Tedarikçileri temizle
        console.log('🗑️  Cari ve tedarikçi kayıtları siliniyor...');
        await prisma.customer.deleteMany({});
        await prisma.supplier.deleteMany({});

        // 3. Kasaları sıfırla (Kasaları silmiyoruz, sadece bakiyeleri 0 yapıyoruz)
        console.log('💰  Kasa bakiyeleri sıfırlanıyor...');
        await prisma.kasa.updateMany({
            data: { balance: 0 }
        });

        // 4. Audit Log'a ekle
        await prisma.auditLog.create({
            data: {
                action: 'FULL_DATA_CLEAR',
                entity: 'SYSTEM',
                details: 'Tüm demo veriler (Cari, Tedarikçi, Tahsilat, Ödeme) temizlendi.',
                userName: 'AI_Assistant'
            }
        });

        console.log('✅ Temizleme işlemi başarıyla tamamlandı.');
    } catch (error) {
        console.error('❌ Hata oluştu:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
