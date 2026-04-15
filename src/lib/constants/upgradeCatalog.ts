// src/lib/constants/upgradeCatalog.ts
export type FeatureAddonKey = 
    | 'field_sales'
    | 'field_service'
    | 'q_commerce'
    | 'kitchen_system'
    | 'marketplaces'
    | 'e_invoice'
    | 'inter_company_billing'
    | 'reconciliation';

export interface CatalogItem {
    id: FeatureAddonKey;
    title: string;
    shortDescription: string;
    fullDescription: string[];
    price: number;
    interval: 'Ay' | 'Yıl';
    iconName: string;
    colorClass: string;
}

export const UPGRADE_CATALOG: Record<FeatureAddonKey, CatalogItem> = {
    field_sales: {
        id: 'field_sales',
        title: 'Saha Satış & Plasiyer',
        shortDescription: 'Plasiyerlerinizin sahada sipariş / tahsilat yapmasını sağlayın.',
        fullDescription: [
            'Canlı rota ve ziyaret araçları',
            'Saha içi direkt sipariş açılışı',
            'Müşteri ziyareti ve fotoğraf çekimi'
        ],
        price: 750,
        interval: 'Ay',
        iconName: 'Map',
        colorClass: 'from-blue-500 to-indigo-600'
    },
    field_service: {
        id: 'field_service',
        title: 'Haritalı Saha Servis',
        shortDescription: 'Servis ekiplerinizi harita üzerinden canlı atayın.',
        fullDescription: [
            'Otomatik randevu rotalama',
            'Servis GPS takibi',
            'Saha görevleri ve parça tüketimi'
        ],
        price: 750,
        interval: 'Ay',
        iconName: 'Wrench',
        colorClass: 'from-amber-400 to-orange-500'
    },
    q_commerce: {
        id: 'q_commerce',
        title: 'Q-Commerce & QR Menü',
        shortDescription: 'Müşterilerinize masadan VEYA evden online sipariş açın.',
        fullDescription: [
            'Canlı Kurye Haritası (Müşteri için)',
            'Gelişmiş QR Menü Altyapısı',
            'Online Ödeme (PayTR) Modülü'
        ],
        price: 900,
        interval: 'Ay',
        iconName: 'Smartphone',
        colorClass: 'from-emerald-400 to-green-600'
    },
    kitchen_system: {
        id: 'kitchen_system',
        title: 'Mutfak KDS / Üretim',
        shortDescription: 'Mutfak veya üretim bandına canlı fiş ekranı koyun.',
        fullDescription: [
            'Sipariş duraklatma ve geri alım',
            'Otomatik sesli bildirim',
            'Otonom Aşçı Raporu'
        ],
        price: 490,
        interval: 'Ay',
        iconName: 'ChefHat',
        colorClass: 'from-rose-400 to-red-600'
    },
    marketplaces: {
        id: 'marketplaces',
        title: 'Pazaryeri Entegrasyonu',
        shortDescription: 'Trendyol, Hepsiburada, Amazon siparişleri tek ekranda.',
        fullDescription: [
            'Otomatik Fatura Kesimi',
            'E-Ticaret Kârlılık Hedeflemesi',
            'Satın Alma İhbarı (Stock Out Alarm)'
        ],
        price: 600,
        interval: 'Ay',
        iconName: 'ShoppingBag',
        colorClass: 'from-purple-500 to-indigo-500'
    },
    e_invoice: {
        id: 'e_invoice',
        title: 'E-Fatura & E-Arşiv',
        shortDescription: 'GİB Onaylı Elektronik Faturacılık.',
        fullDescription: [
            'Gelen ve Giden E-Fatura paneli',
            'İrsaliye Entegrasyonu',
            'Mali Müşavir paneli aktarımı'
        ],
        price: 350,
        interval: 'Ay',
        iconName: 'Receipt',
        colorClass: 'from-sky-400 to-blue-600'
    },
    inter_company_billing: {
        id: 'inter_company_billing',
        title: 'Holdinq Grup Otonom Fatura',
        shortDescription: 'Grup şirketleriniz arasında çapraz fatura botu.',
        fullDescription: [
            'A Şirketi Satış Keser, B Şirketi Alış Faturası Görür',
            'Sıfır hata, sıfır insan eforu',
            'Konsolide Bilanço Aktarımı'
        ],
        price: 1500,
        interval: 'Ay',
        iconName: 'Building2',
        colorClass: 'from-slate-700 to-slate-900'
    },
    reconciliation: {
        id: 'reconciliation',
        title: 'e-Mutabakat (BA/BS)',
        shortDescription: 'Tedarikçi ve Müşterileriniz ile dijital finansal bakiye onayı.',
        fullDescription: [
            'SMS doğrulama ile onay',
            'İtiraz modülü (Dispute)',
            'Hukuki Hash loglama (Değiştirilemez)'
        ],
        price: 450,
        interval: 'Ay',
        iconName: 'Handshake',
        colorClass: 'from-teal-400 to-emerald-600'
    }
};
