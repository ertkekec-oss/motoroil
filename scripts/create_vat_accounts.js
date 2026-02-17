// Create VAT Accounts
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createVatAccounts() {
    try {
        console.log('🧾 Creating VAT Accounts...\n');

        const vatAccounts = [
            // 190 DEVREDEN KDV
            { code: '190', name: 'DEVREDEN KDV', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },

            // 191 İNDİRİLECEK KDV
            { code: '191', name: 'İNDİRİLECEK KDV', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '191.01', name: 'İndirilecek KDV %1', parentCode: '191', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '191.10', name: 'İndirilecek KDV %10', parentCode: '191', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '191.20', name: 'İndirilecek KDV %20', parentCode: '191', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },

            // 391 HESAPLANAN KDV
            { code: '391', name: 'HESAPLANAN KDV', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' },
            { code: '391.01', name: 'Hesaplanan KDV %1', parentCode: '391', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' },
            { code: '391.10', name: 'Hesaplanan KDV %10', parentCode: '391', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' },
            { code: '391.20', name: 'Hesaplanan KDV %20', parentCode: '391', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' }
        ];

        for (const account of vatAccounts) {
            // Check if exists
            const existing = await prisma.account.findFirst({
                where: { code: account.code, branch: 'Merkez' }
            });

            if (!existing) {
                await prisma.account.create({
                    data: {
                        ...account,
                        branch: 'Merkez',
                        balance: 0,
                        isActive: true
                    }
                });
                console.log(`   ✓ Created ${account.code} - ${account.name}`);
            } else {
                console.log(`   • Exists ${account.code}`);
            }
        }

        console.log('\n✅ VAT Accounts setup complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createVatAccounts();
