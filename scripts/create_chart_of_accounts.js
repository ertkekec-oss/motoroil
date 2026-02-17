// Create Chart of Accounts
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createChartOfAccounts() {
    try {
        console.log('📊 Creating Chart of Accounts...\n');

        const accounts = [
            // DÖNEN VARLIKLAR (100-199)
            { code: '100', name: 'KASA', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '100.01', name: 'Nakit Kasalar', parentCode: '100', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '102', name: 'BANKALAR', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '102.01', name: 'Banka Hesapları', parentCode: '102', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '120', name: 'ALICILAR', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '120.01', name: 'Müşteri Alacakları', parentCode: '120', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '153', name: 'TİCARİ MALLAR', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },
            { code: '153.01', name: 'Ticari Mal Stoku', parentCode: '153', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlıklar', reportType: 'BILANCO', type: 'Borç' },

            // KISA VADELİ YABANCI KAYNAKLAR (300-399)
            { code: '320', name: 'SATICILAR', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' },
            { code: '320.01', name: 'Tedarikçi Borçları', parentCode: '320', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' },
            { code: '360', name: 'ÖDENECEK VERGİ VE FONLAR', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' },
            { code: '360.01', name: 'Ödenecek KDV', parentCode: '360', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynaklar', reportType: 'BILANCO', type: 'Alacak' },

            // ÖZKAYNAKLAR (500-599)
            { code: '500', name: 'SERMAYE', accountClass: 'OZKAYNAK', normalBalance: 'ALACAK', reportGroup: 'Özkaynak', reportType: 'BILANCO', type: 'Alacak' },
            { code: '500.01', name: 'Ödenmiş Sermaye', parentCode: '500', accountClass: 'OZKAYNAK', normalBalance: 'ALACAK', reportGroup: 'Özkaynak', reportType: 'BILANCO', type: 'Alacak' },
            { code: '590', name: 'DÖNEM NET KARI', accountClass: 'OZKAYNAK', normalBalance: 'ALACAK', reportGroup: 'Özkaynak', reportType: 'BILANCO', type: 'Alacak' },

            // GELİRLER (600-699)
            { code: '600', name: 'YURTİÇİ SATIŞLAR', accountClass: 'GELIR', normalBalance: 'ALACAK', reportGroup: 'Brüt Satışlar', reportType: 'GELIR_TABLOSU', type: 'Alacak' },
            { code: '600.01', name: 'Mal Satış Gelirleri', parentCode: '600', accountClass: 'GELIR', normalBalance: 'ALACAK', reportGroup: 'Brüt Satışlar', reportType: 'GELIR_TABLOSU', type: 'Alacak' },
            { code: '610', name: 'HİZMET SATIŞ GELİRLERİ', accountClass: 'GELIR', normalBalance: 'ALACAK', reportGroup: 'Brüt Satışlar', reportType: 'GELIR_TABLOSU', type: 'Alacak' },
            { code: '610.01', name: 'Hizmet Gelirleri', parentCode: '610', accountClass: 'GELIR', normalBalance: 'ALACAK', reportGroup: 'Brüt Satışlar', reportType: 'GELIR_TABLOSU', type: 'Alacak' },

            // GİDERLER (700-799)
            { code: '710', name: 'DİREKT İLK MADDE VE MALZEME GİDERLERİ', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Satışların Maliyeti', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '710.01', name: 'Mal Alış Maliyeti', parentCode: '710', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Satışların Maliyeti', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '760', name: 'PAZARLAMA SATIŞ VE DAĞITIM GİDERLERİ', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Faaliyet Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '760.01', name: 'Pazarlama Giderleri', parentCode: '760', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Faaliyet Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '770', name: 'GENEL YÖNETİM GİDERLERİ', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Faaliyet Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '770.01', name: 'Kira Giderleri', parentCode: '770', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Faaliyet Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '770.02', name: 'Personel Maaş Giderleri', parentCode: '770', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Faaliyet Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '770.03', name: 'Elektrik-Su-Doğalgaz', parentCode: '770', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Faaliyet Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' },

            // FİNANSMAN GİDERLERİ (780-789)
            { code: '780', name: 'FİNANSMAN GİDERLERİ', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Finansman Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' },
            { code: '780.01', name: 'Kredi Kartı Komisyon Giderleri', parentCode: '780', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Finansman Giderleri', reportType: 'GELIR_TABLOSU', type: 'Borç' }
        ];

        for (const account of accounts) {
            await prisma.account.create({
                data: {
                    ...account,
                    branch: 'Merkez',
                    balance: 0,
                    isActive: true
                }
            });
            console.log(`   ✓ ${account.code} - ${account.name}`);
        }

        console.log('\n✅ Chart of Accounts created successfully!');
        console.log(`\n📊 Total Accounts: ${accounts.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createChartOfAccounts();
