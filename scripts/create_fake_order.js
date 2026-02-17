
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🛠️ Sahte E-Ticaret Siparişi Oluşturuluyor...');

    try {
        const orderNumber = `TEST-${Date.now()}`;

        // 1. Sahte Sipariş Oluştur
        const newOrder = await prisma.order.create({
            data: {
                marketplace: 'Trendyol', // POS Değil!
                marketplaceId: 'TY-' + Date.now(),
                orderNumber: orderNumber,
                customerName: 'Test Müşterisi',
                customerEmail: 'test@example.com',
                totalAmount: 1250.50,
                currency: 'TRY',
                status: 'Yeni', // Sayfada "Yeni" filtresinde görünmeli
                orderDate: new Date(),
                items: [
                    { name: 'Lastik Parlatıcı', qty: 2, price: 250 },
                    { name: 'Motor Yağı', qty: 1, price: 750 }
                ],
                shippingAddress: { city: 'İstanbul', district: 'Kadıköy' },
                rawData: { source: 'Manuel Test Scripti' }
            }
        });

        console.log(`✅ Sipariş Oluşturuldu: ${newOrder.orderNumber} (ID: ${newOrder.id})`);
        console.log(`ℹ️ Marketplace: ${newOrder.marketplace}, Status: ${newOrder.status}`);
        console.log('👉 Şimdi sayfayı yenileyip bu siparişi görüp göremediğinizi kontrol edin.');

    } catch (e) {
        console.error('❌ Hata:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
