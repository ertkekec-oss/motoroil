const fs = require('fs');
let file = fs.readFileSync('src/app/(app)/terminal/TerminalClient.tsx', 'utf8');

if (!file.includes('const { t } = useLanguage()')) {
    file = file.replace("import { useSettings } from '@/contexts/SettingsContext';", "import { useSettings } from '@/contexts/SettingsContext';\nimport { useLanguage } from '@/contexts/LanguageContext';");
    file = file.replace("const { appSettings, updateAppSetting, campaigns } = useSettings();", "const { appSettings, updateAppSetting, campaigns } = useSettings();\n    const { t } = useLanguage();");
}

const replacements = [
    ["Cari:", "{t('terminal.customer')}:"],
    ["Açık Hesap", "{t('terminal.openAccount')}"],
    ["Canlı Kur Açık", "{t('terminal.liveRateOn')}"],
    ["Canlı Kur Kapalı", "{t('terminal.liveRateOff')}"],
    ["Aktif olduğunda ürünlerin döviz kurları anlık olarak TL\\'ye çevrilerek satışı yapılır.", "{t('terminal.liveRateTooltip')}"],
    ["> Kupon", "> {t('terminal.coupon')}"],
    ["> Puan", "> {t('terminal.points')}"],
    ["> Ref", "> {t('terminal.ref')}"],
    ["Bekleyen (", "{t('terminal.pending')} ("],
    [">Hızlı Satış<", ">{t('terminal.quickSale')}<"],
    ["> Resto-Pos<", "> {t('terminal.restoPos')}<"],
    [">E-Fatura<", ">{t('terminal.eInvoice')}<"],
    [">E-Müstahsil<", ">{t('terminal.eMustahsil')}<"],
    [">E-SMM<", ">{t('terminal.eSmm')}<"],
    ["Müşteri Seçimi (F8)", "{t('terminal.customerSelection')}"],
    ["placeholder=\"Arama...\"", "placeholder={t('terminal.searchPlaceholder')}"],
    [">ESC - Kapat<", ">{t('terminal.escClose')}<"],
    [">Bekleyen Satışlar (F9)<", ">{t('terminal.pendingSales')}<"],
    [">Bekleyen satış yok.<", ">{t('terminal.noPendingSales')}<"],
    [">AÇ<", ">{t('terminal.openBtn')}<"],
    [">SİL<", ">{t('terminal.deleteBtn')}<"],
    [" Ürün</div>", " {t('terminal.productsText')}</div>"],
    [">Satışı Beklemeye Al<", ">{t('terminal.suspendSale')}<"],
    ["placeholder=\"Etiket / İsim (Örn: Masa 5 veya Müşteri Adı)\"", "placeholder={t('terminal.suspendLabelPlaceholder')}"],
    [">İptal<", ">{t('common.cancel')}<"],
    [">Beklemeye Al<", ">{t('terminal.btnSuspend')}<"],
    [">Ekstra & İndirimler<", ">{t('terminal.extrasDiscounts')}<"],
    ["Sepet İndirimi (₺)", "{t('terminal.cartDiscount')} (₺)"],
    ["placeholder=\"KOD GİRİN\"", "placeholder={t('terminal.enterCode')}"],
    [">Puan Kullan<", ">{t('terminal.usePoints')}<"],
    ["Kullanılabilir<", "{t('terminal.available')}<"],
    ["Sipariş Notu / Referans", "{t('terminal.orderNote')}"],
    ["placeholder=\"Belge, plaka veya masa no...\"", "placeholder={t('terminal.notePlaceholder')}"],
    [">ONAYLA<", ">{t('terminal.confirm')}<"],
    ["Ödemeyi Tamamla", "{t('terminal.completePayment')}"],
    [">Sepet Ara Toplam<", ">{t('terminal.cartSubtotal')}<"],
    [">Manuel İndirim / Puan<", ">{t('terminal.manualDiscount')}<"],
    ["Otomatik Kazanımlar", "{t('terminal.autoRewards')}"],
    [">Kampanya İndirimi<", ">{t('terminal.campaignDiscount')}<"],
    [">Kazanılacak Parapuan<", ">{t('terminal.pointsToEarn')}<"],
    [">Bedelsiz Sepette<", ">{t('terminal.freeInCart')}<"],
    [">Genel Toplam<", ">{t('terminal.grandTotal')}<"],
    [">Hedef Kasa / Banka Seçimi<", ">{t('terminal.selectVaultBank')}<"],
    ["• Bakiye:", "• {t('terminal.balance')}:"],
    ["Bu ödeme tipi için tanımlı kasa bulunamadı.", "{t('terminal.noVaultFound')}"],
    [">Taksit / Kredi Kartı Komisyonu Seçimi<", ">{t('terminal.selectInstallment')}<"],
    ["Kesinti:", "{t('terminal.deduction')}:"],
    [">İptal / Vazgeç<", ">{t('terminal.cancelGiveUp')}<"],
    ["'İŞLENİYOR...' : 'ONAYLA VE BİTİR'", "t('terminal.processing') : t('terminal.confirmFinish')"]
];

for (const [search, replace] of replacements) {
    file = file.replaceAll(search, replace);
}

fs.writeFileSync('src/app/(app)/terminal/TerminalClient.tsx', file);
console.log('TerminalClient i18n applied!');
