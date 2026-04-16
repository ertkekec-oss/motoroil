const fs = require('fs');
let file = fs.readFileSync('src/components/terminal/EAdisyonWorkspace.tsx', 'utf8');

if (!file.includes('useLanguage')) {
    file = file.replace("import { useModal } from '@/contexts/ModalContext';", "import { useModal } from '@/contexts/ModalContext';\nimport { useLanguage } from '@/contexts/LanguageContext';");
    file = file.replace("const { showWarning, showSuccess } = useModal();", "const { showWarning, showSuccess } = useModal();\n    const { t } = useLanguage();");
}

const replacements = [
    ["E-Adisyon Başarıyla Yazdırıldı", "{t('adission.successTitle')}"],
    ["Belge GİB\\'e iletildi ve fiş çıkartılıyor.", "{t('adission.successDesc')}"],
    ["E-Adisyon Yazdırıldı", "{t('adission.successTitle')}"],
    ["hesabına ait elektronik adisyon başarıyla GİB\\'e iletildi ve mutfak fişi çıkarılıyor.", "{t('adission.successDesc')}"],
    [">SALON (İÇ MEKAN)<", ">{t('adission.salon')}<"],
    [">TERAS<", ">{t('adission.teras')}<"],
    [">BAHÇE<", ">{t('adission.bahce')}<"],
    [">Sepette ürün yok.<", ">{t('adission.emptyCart')}<"],
    [">Ürün<", ">{t('adission.thProd')}<"],
    [">Miktar<", ">{t('adission.thQty')}<"],
    [">Tutar<", ">{t('adission.thTotal')}<"],
    [">Yeni<", ">{t('adission.statusNew')}<"],
    [">UYGUN<", ">{t('adission.statusAvailable')}<"],
    [">Genel Toplam<", ">{t('adission.generalTotal')}<"],
    [">YAZDIRILIYOR...<", ">{t('adission.btnPrinting')}<"],
    ["> MUTFAK / BAR<", "> {t('adission.btnKitchen')}<"],
    [">KAPATILIYOR...<", ">{t('adission.btnClosing')}<"],
    ["> HESABI KAPAT<", "> {t('adission.btnCheckout')}<"],
    [">Kasa Beklemede<", ">{t('adission.standbyTitle')}<"],
    [">İşlem yapmak için sol taraftan bir masa seçin.<", ">{t('adission.standbyDesc')}<"],
    ["> dk<", "> {t('adission.minutes')}<"],
    ["'Belirsiz'", "t('adission.unknown')"],
    ["\"Adisyon Boş\"", "t('adission.emptyAdission')"],
    [">Adisyon Boş<", ">{t('adission.emptyAdission')}<"],
    ["\"Masaya henüz ürün eklenmemiş.\"", "t('adission.errEmpty')"],
    ["\"Mutfağa iletilecek yeni bir ürün yok.\"", "t('adission.errKitchenEmpty')"],
    ["\"Mutfağa İletildi\"", "t('adission.kitchenSuccess')"],
    ["yeni ürün/istek IP mutfak yazıcısına başarıyla gönderildi.", " {t('adission.kitchenSuccessDesc')}"]
];

for (const [search, replace] of replacements) {
    file = file.replaceAll(search, replace);
}

// Special cases string interpolation fixes
file = file.replaceAll("`${unsentItems.length} {t('adission.kitchenSuccessDesc')}`", "`${unsentItems.length} ${t('adission.kitchenSuccessDesc')}`");

fs.writeFileSync('src/components/terminal/EAdisyonWorkspace.tsx', file);
console.log('EAdisyonWorkspace i18n applied!');
