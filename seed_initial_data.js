// Create Initial Data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInitialData() {
    try {
        console.log('🌱 Seeding initial data...\n');

        // 1. Create Branches
        console.log('📍 Creating branches...');
        const merkez = await prisma.branch.create({
            data: {
                name: 'Merkez',
                type: 'Merkez',
                city: 'İstanbul',
                status: 'Aktif'
            }
        });
        console.log('   ✓ Merkez branch created');

        // 2. Create Kasalar
        console.log('\n💰 Creating kasalar...');

        const kasalar = [
            { name: 'KASA-MERKEZ', type: 'Nakit', balance: 0, branch: 'Merkez' },
            { name: 'HALK BANKASI - K', type: 'Banka', balance: 0, branch: 'Merkez' },
            { name: 'HALK BANKASI - POS', type: 'POS', balance: 0, branch: 'Merkez' },
            { name: 'KUVEYT TÜRK - K', type: 'Banka', balance: 0, branch: 'Merkez' },
            { name: 'ÇEK / SENET PORTFÖYÜ', type: 'Evrak', balance: 0, branch: 'Merkez' }
        ];

        for (const kasa of kasalar) {
            await prisma.kasa.create({ data: kasa });
            console.log(`   ✓ ${kasa.name} created`);
        }

        // 3. Create Default Customer
        console.log('\n👤 Creating default customer...');
        await prisma.customer.create({
            data: {
                name: 'Perakende Müşteri',
                branch: 'Merkez',
                balance: 0,
                points: 0
            }
        });
        console.log('   ✓ Perakende Müşteri created');

        // 4. Create Payment Methods
        console.log('\n💳 Creating payment methods...');
        await prisma.appSettings.create({
            data: {
                key: 'paymentMethods',
                value: [
                    { id: 'cash', label: 'NAKİT', icon: '💵', type: 'cash' },
                    { id: 'card', label: 'KREDİ KARTI', icon: '💳', type: 'card' },
                    { id: 'transfer', label: 'HAVALE/EFT', icon: '🏦', type: 'transfer' }
                ]
            }
        });
        console.log('   ✓ Payment methods created');

        // 5. Create Sales Expenses Settings
        console.log('\n📊 Creating sales expenses settings...');
        await prisma.appSettings.create({
            data: {
                key: 'salesExpenses',
                value: {
                    posCommissions: [
                        { installment: '2 Taksit', rate: 2.5 },
                        { installment: '3 Taksit', rate: 3.0 },
                        { installment: '6 Taksit', rate: 4.5 },
                        { installment: '9 Taksit', rate: 6.0 },
                        { installment: '12 Taksit', rate: 7.5 }
                    ]
                }
            }
        });
        console.log('   ✓ Sales expenses settings created');

        console.log('\n\n✅ All initial data seeded successfully!');
        console.log('\n📋 Summary:');
        console.log('   • 1 Branch (Merkez)');
        console.log('   • 5 Kasalar');
        console.log('   • 1 Default Customer');
        console.log('   • Payment Methods configured');
        console.log('   • POS Commissions configured');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedInitialData();
