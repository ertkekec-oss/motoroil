
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Demo veriler yükleniyor...');

    // 1. Admin Kullanıcısı
    await prisma.user.upsert({
        where: { email: 'admin@motoroil.com' },
        update: {},
        create: {
            email: 'admin@motoroil.com',
            name: 'Yönetici',
            password: 'admin', // Gerçek uygulamada hashlenmeli!
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin kullanıcısı oluşturuldu: admin@motoroil.com / admin');

    // 2. Kasalar
    const merkezKasa = await prisma.kasa.create({
        data: {
            name: 'Merkez Nakit Kasa',
            type: 'Nakit',
            balance: 50000,
            currency: 'TRY',
        },
    });

    const posKasa = await prisma.kasa.create({
        data: {
            name: 'Garanti POS',
            type: 'POS',
            balance: 125000,
            currency: 'TRY',
        },
    });
    console.log('✅ Kasalar oluşturuldu.');

    // 3. Tedarikçiler
    const tedarikci1 = await prisma.supplier.create({
        data: {
            name: 'Castrol Türkiye',
            phone: '0212 123 45 67',
            email: 'info@castrol.com.tr',
            category: 'Yağ',
            balance: -15000, // Borcumuz var
        },
    });
    console.log('✅ Tedarikçiler eklendi.');

    // 4. Müşteriler
    const musteri1 = await prisma.customer.create({
        data: {
            name: 'Ahmet Yılmaz Oto Servis',
            phone: '0532 555 11 22',
            email: 'ahmet@otoservis.com',
            balance: 2500, // Bize borcu var
        },
    });
    console.log('✅ Müşteriler eklendi.');

    // 5. Ürünler
    await prisma.product.createMany({
        data: [
            {
                name: 'Castrol Edge 5W-30 LL 4L',
                code: 'YAG-001',
                barcode: '8691234567890',
                price: 1250.00,
                buyPrice: 850.00,
                stock: 45,
                category: 'Motor Yağı',
                brand: 'Castrol',
            },
            {
                name: 'Bosch Yağ Filtresi (VW Passat)',
                code: 'FLT-001',
                barcode: '8699876543210',
                price: 350.00,
                buyPrice: 180.00,
                stock: 120,
                category: 'Filtre',
                brand: 'Bosch',
            },
            {
                name: 'Motul 8100 X-cess 5W-40 5L',
                code: 'YAG-002',
                barcode: '3374650239265',
                price: 1450.00,
                buyPrice: 950.00,
                stock: 20,
                category: 'Motor Yağı',
                brand: 'Motul',
            },
        ],
    });
    console.log('✅ Ürünler eklendi.');

    // 6. İşlemler
    await prisma.transaction.create({
        data: {
            type: 'Gelir',
            amount: 2500,
            description: 'Ahmet Yılmaz Tahsilat',
            kasaId: merkezKasa.id,
            customerId: musteri1.id,
            date: new Date(),
        },
    });

    console.log('🚀 Tüm demo veriler başarıyla yüklendi!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
