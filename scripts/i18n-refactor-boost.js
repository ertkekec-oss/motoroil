const fs = require('fs');

let file = fs.readFileSync('src/app/(app)/seller/boost/page.tsx', 'utf8');

if (!file.includes('const { t } = useLanguage()')) {
    file = file.replace("import { TrendingUp, BarChart } from \"lucide-react\";", "import { TrendingUp, BarChart } from \"lucide-react\";\nimport { useLanguage } from '@/contexts/LanguageContext';");
    file = file.replace("export default function BoostPage() {", "export default function BoostPage() {\n    const { t } = useLanguage();");
}

const replacements = [
    ["\"Bilinmeyen Plan\"", "t('boost.unknownPlan')"],
    [">Boost Yönetimi<", ">{t('boost.title')}<"],
    [">\\s*B2B Katalog sponsorlu ürün gösterim paketlerinizi ve kotalarınızı yönetin\\.\\s*<", ">{t('boost.desc')}<"],
    ["> Performans Raporu<", "> {t('boost.perfReport')}<"],
    [">\\s*Abonelik detaylarınız yükleniyor\\.\\.\\.\\s*<", ">{t('boost.loading')}<"],
    [">\\s*Aktif bir Boost aboneliğiniz bulunmuyor\\. Yeni bir plan seçerek hemen başlayın\\.\\s*<", ">{t('boost.noSub')}<"],
    [">Mevcut Planınız<", ">{t('boost.currentPlan')}<"],
    ["boostData.status === 'ACTIVE' ? 'Aktif' : 'Askıda'", "boostData.status === 'ACTIVE' ? t('boost.active') : t('boost.suspended')"],
    [">/ ay<", ">{t('boost.perMonth')}<"],
    [">Kota Kullanımı (Gösterim)<", ">{t('boost.quotaUsage')}<"],
    [">Yenilenme Tarihi:<", ">{t('boost.renewalDate')}:<"],
    [">Planı Değiştir<", ">{t('boost.changePlan')}<"],
    [">Boost Sistemi Nasıl Çalışır?<", ">{t('boost.howItWorks')}<"],
    [">Sponsorlu Gösterimler<", ">{t('boost.sponsoredViews')}<"],
    [">Belirlediğiniz ürünler, B2B Kataloğunda ve arama sonuçlarında ön sıralara çıkartılır\\. Tıklama değil gösterim üzerinden kota düşer\\.<", ">{t('boost.sponsoredDesc')}<"],
    [">Performans Takibi<", ">{t('boost.perfTracking')}<"],
    [">\"Performans Raporu\" sekmesinden anlık olarak hangi kategoride ne kadar etkileşim aldığınızı analiz edebilirsiniz\\.<", ">{t('boost.perfDesc')}<"],
    [">Faturalandırma & Ödeme<", ">{t('boost.billingPayment')}<"],
    [">Abonelik ücretleriniz aylık olarak tahakkuk ettirilir ve Kazançlarınızdan \\(Escrow\\) rezerve edilebilir veya manuel ödenebilir\\.<", ">{t('boost.billingDesc')}<"]
];

for (const [search, replace] of replacements) {
    if (search.includes('\\s*')) {
        file = file.replace(new RegExp(search, "g"), replace);
    } else {
        file = file.replaceAll(search, replace);
    }
}

fs.writeFileSync('src/app/(app)/seller/boost/page.tsx', file);
console.log('BoostPage i18n applied!');
