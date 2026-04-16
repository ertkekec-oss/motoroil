const fs = require('fs');
let file = fs.readFileSync('src/components/terminal/EMustahsilWorkspace.tsx', 'utf8');

if (!file.includes('const { t } = useLanguage()')) {
    file = file.replace("import { useModal } from '@/contexts/ModalContext';", "import { useModal } from '@/contexts/ModalContext';\nimport { useLanguage } from '@/contexts/LanguageContext';");
    file = file.replace("const { showWarning, showSuccess } = useModal();", "const { showWarning, showSuccess } = useModal();\n    const { t } = useLanguage();");
}

const replacements = [
    ["\"Üretici Seçimi Eksik\"", "t('emustahsil.errFarmer')"],
    ["\"Makbuz düzenleyebilmek için lütfen Müstahsil (Çiftçi) seçiniz.\"", "t('emustahsil.errFarmerDesc')"],
    ["\"Makbuz Boş\"", "t('emustahsil.errEmpty')"],
    ["\"Lütfen en az bir kalem ekleyiniz.\"", "t('emustahsil.errEmptyDesc')"],
    ["\"E-Müstahsil Makbuzu Başarıyla İletildi\"", "t('emustahsil.successMsg')"],
    ["`Belge Numarası: ${", "`\\${t('emustahsil.docNo')}: ${"],
    ["\"Hata Oluştu\"", "t('emustahsil.errOccurred')"],
    ["\"Makbuz oluşturulamadı.\"", "t('emustahsil.errFailed')"],
    ["\"Bağlantı Hatası\"", "t('emustahsil.errConn')"],
    [">E-Müstahsil Makbuzu Düzenlendi<", ">{t('emustahsil.successTitle')}<"],
    [">Belge başarıyla GİB portalına iletilmek üzere sıraya alındı.<", ">{t('emustahsil.successDetail')}<"],
    [">YENİ MAKBUZ<", ">{t('emustahsil.btnNew')}<"],
    [">PDF OLARAK İNDİR<", ">{t('emustahsil.btnPdf')}<"],
    [">ÇİFTÇİ / MÜSTAHSİL (SATICI)<", ">{t('emustahsil.farmerSeller')}<"],
    ["placeholder=\"Üretici Ad Soyad veya TC/VKN Ara...\"", "placeholder={t('emustahsil.searchPlaceholder')}"],
    [">Son Kullanılan Üreticiler<", ">{t('emustahsil.recentFarmers')}<"],
    ["> Üreticiyi Değiştir<", "> {t('emustahsil.changeFarmer')}<"],
    ["TC/VKN: {c.taxNumber || 'Tanımsız'}", "{t('emustahsil.tcVkn')}: {c.taxNumber || t('emustahsil.undefined')}"],
    ["TC/VKN: <span className=\"font-bold\">{selectedCustomer.taxNumber || 'Belirtilmemiş'}</span>", "{t('emustahsil.tcVkn')}: <span className=\"font-bold\">{selectedCustomer.taxNumber || t('emustahsil.unspecified')}</span>"],
    ["{selectedCustomer.address || 'Adres bilgisi eksik.'}", "{selectedCustomer.address || t('emustahsil.noAddress')}"],
    [">Belge Tipi<", ">{t('emustahsil.docType')}<"],
    [">E-MÜSTAHSİL MAKBUZU<", ">{t('emustahsil.docTypeLabel')}<"],
    [">Döviz<", ">{t('emustahsil.currency')}<"],
    [">TCMB Kuru<", ">{t('emustahsil.cbrtRate')}<"],
    [">Düzenlenme Tarihi<", ">{t('emustahsil.issueDate')}<"],
    [">Şube / Kasa<", ">{t('emustahsil.branch')}<"],
    [">Merkez (Online)<", ">{t('emustahsil.hq')}<"],
    [">Hizmet / Tarımsal Ürün Adı<", ">{t('emustahsil.thProduct')}<"],
    [">Miktar(Kg/Ad)<", ">{t('emustahsil.thQty')}<"],
    [">Birim Fiyat<", ">{t('emustahsil.thPrice')}<"],
    [">GV(%)<", ">{t('emustahsil.thGv')}<"],
    [">SGK(%)<", ">{t('emustahsil.thSgk')}<"],
    [">Borsa(%)<", ">{t('emustahsil.thBorsa')}<"],
    [">Mera(%)<", ">{t('emustahsil.thMera')}<"],
    [">Brüt Tutar<", ">{t('emustahsil.thGross')}<"],
    ["placeholder=\"Örn: Buğday, Arpa, Süt...\"", "placeholder={t('emustahsil.pHint')}"],
    [">🔍 Stok Arama<", ">{t('emustahsil.stockSearch')}<"],
    [">Stok Kartları<", ">{t('emustahsil.stockCards')}<"],
    [">Sonuç bulunamadı.<", ">{t('emustahsil.noResults')}<"],
    ["> YENİ KALEM EKLE<", "> {t('emustahsil.btnAddLine')}<"],
    [">Makbuz Alt Notu / Açıklama<", ">{t('emustahsil.noteLabel')}<"],
    ["placeholder=\"Kesinti açıklamaları vs...\"", "placeholder={t('emustahsil.notePlaceholder')}"],
    [">Müstahsil Brüt Tutar<", ">{t('emustahsil.grossTotal')}<"],
    [">(-) Gelir Vergisi (Stopaj)<", ">{t('emustahsil.gvLabel')}<"],
    [">(-) Bağ-Kur / SGK Kesintisi<", ">{t('emustahsil.sgkLabel')}<"],
    [">(-) Borsa Tescil Ücreti<", ">{t('emustahsil.borsaLabel')}<"],
    [">(-) Mera Fonu<", ">{t('emustahsil.meraLabel')}<"],
    ["title=\"Net Üreticiye Ödenecek Tutar\"", "title={t('emustahsil.netPayableHint')}"],
    [">ÇİFTÇİYE ÖDENECEK NET<", ">{t('emustahsil.netPayable')}<"],
    [">Sistem (TL) Karşılığı<", ">{t('emustahsil.sysEquiv')}<"],
    [">Para Çıkış Yönü<", ">{t('emustahsil.cashFlow')}<"],
    [">Üreticiye Ödeme Devri<", ">{t('emustahsil.paymentTransfer')}<"],
    ["> Nakit Ödeme<", "> {t('emustahsil.btnCash')}<"],
    ["> Hesaba Havale<", "> {t('emustahsil.btnTransfer')}<"],
    ["> Cari Vade<", "> {t('emustahsil.btnDeferred')}<"],
    ["> TASLAK OLARAK KAYDET<", "> {t('emustahsil.btnDraft')}<"],
    [">TASLAK<", ">{t('emustahsil.btnDraftShort')}<"],
    ["'BEKLEYİNİZ...' : 'E-MÜSTAHSİL OLUŞTUR'", "t('emustahsil.btnWait') : t('emustahsil.btnCreate')"]
];

for (const [search, replace] of replacements) {
    file = file.replaceAll(search, replace);
}

fs.writeFileSync('src/components/terminal/EMustahsilWorkspace.tsx', file);
console.log('EMustahsilWorkspace i18n applied!');
