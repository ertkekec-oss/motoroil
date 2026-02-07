
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const defaultFeatures = [
        { key: 'pos', name: '🏮 POS Terminal', description: 'Hızlı satış, fiş kesme ve kasa yönetimi.' },
        { key: 'financials', name: '🏛️ Finansal Yönetim', description: 'Gider takibi, kasa/banka yönetimi ve nakit akışı.' },
        { key: 'sales', name: '🧾 Satış Yönetimi', description: 'Satış faturaları, iade süreçleri ve satış raporları.' },
        { key: 'quotes', name: '📋 Teklifler', description: 'Proforma fatura ve müşteri teklif yönetimi.' },
        { key: 'current_accounts', name: '🤝 Cari Hesaplar', description: 'Müşteri borç/alacak takibi ve risk yönetimi.' },
        { key: 'suppliers', name: '🚚 Tedarikçi Ağı', description: 'Tedarikçi yönetimi, alım faturaları ve ödeme takibi.' },
        { key: 'inventory', name: '📥 Envanter & Depo', description: 'Stok takibi, depo transferleri ve sayım işlemleri.' },
        { key: 'service_desk', name: '🛠️ Servis Masası', description: 'Teknik servis kayıtları, iş emri ve parça takibi.' },
        { key: 'analytics', name: '📊 Veri Analizi', description: 'Gelişmiş kârlılık analizleri ve performans raporları.' },
        { key: 'fraud_detection', name: '🚨 Kaçak Satış Tespit', description: 'Şüpheli işlem analizi ve satış güvenliği.' },
        { key: 'accountant', name: '💼 Mali Müşavir', description: 'Müşavir paneli erişimi ve beyanname hazırlık verileri.' },
        { key: 'marketplaces', name: '🏪 Pazaryeri Entegrasyonu', description: 'Trendyol, Hepsiburada, Amazon pazaryeri yönetimi.' },
        { key: 'ecommerce', name: '🌐 E-Ticaret Entegrasyonu', description: 'Web sitesi siparişleri ve stok senkronizasyonu.' },
        { key: 'einvoice', name: '🧾 E-Fatura Paketleri', description: 'E-fatura, e-arşiv ve e-irsaliye (Tüm paketlerde standart).' }
    ];

    console.log('Updating features in database...');
    for (const feat of defaultFeatures) {
        await prisma.feature.upsert({
            where: { key: feat.key },
            update: { name: feat.name, description: feat.description },
            create: feat,
        });
    }
    console.log('Features updated successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
