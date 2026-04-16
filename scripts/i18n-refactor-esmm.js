const fs = require('fs');
let file = fs.readFileSync('src/components/terminal/ESMMWorkspace.tsx', 'utf8');

if (!file.includes('const { t } = useLanguage()')) {
    file = file.replace("import { useModal } from '@/contexts/ModalContext';", "import { useModal } from '@/contexts/ModalContext';\nimport { useLanguage } from '@/contexts/LanguageContext';");
    file = file.replace("const { showWarning, showSuccess } = useModal();", "const { showWarning, showSuccess } = useModal();\n    const { t } = useLanguage();");
}

const replacements = [
    ["\"Müşteri Seçimi Eksik\"", "t('esmm.errCustomer')"],
    ["\"Makbuz düzenleyebilmek için lütfen alıcı seçiniz.\"", "t('esmm.errCustomerDesc')"],
    ["\"Makbuz Boş\"", "t('esmm.errEmpty')"],
    ["\"Lütfen en az bir hizmet ekleyiniz ve tutar giriniz.\"", "t('esmm.errEmptyDesc')"],
    ["\"E-SMM Başarıyla İletildi\"", "t('esmm.successMsg')"],
    ["\"Hata Oluştu\"", "t('esmm.errOccurred')"],
    ["\"Makbuz oluşturulamadı.\"", "t('esmm.errFailed')"],
    ["\"Bağlantı Hatası\"", "t('esmm.errConn')"],
    [">E-SMM Düzenlendi<", ">{t('esmm.successTitle')}<"],
    [">Serbest Meslek Makbuzunuz başarıyla oluşturuldu ve GİB portalına iletilmek üzere kuyruğa eklendi.<", ">{t('esmm.successDetail')}<"],
    [">YENİ E-SMM<", ">{t('esmm.btnNew')}<"],
    [">PDF OLARAK İNDİR<", ">{t('esmm.btnPdf')}<"],
    [">MÜŞTERİ / ALICI<", ">{t('esmm.customerBuyer')}<"],
    ["placeholder=\"Firma Ünvanı veya Müşteri Adı Ara...\"", "placeholder={t('esmm.searchPlaceholder')}"],
    [">Son Kullanılanlar<", ">{t('esmm.recentCustomers')}<"],
    ["> Değiştir<", "> {t('esmm.change')}<"],
    ["VKN/TC: {c.taxNumber || 'Tanımsız'}", "{t('esmm.vknTc')}: {c.taxNumber || t('esmm.undefined')}"],
    ["VKN: <span className=\"font-bold\">{selectedCustomer.taxNumber || 'Belirtilmemiş'}</span>", "{t('esmm.vkn')}: <span className=\"font-bold\">{selectedCustomer.taxNumber || t('esmm.unspecified')}</span>"],
    ["{selectedCustomer.address || 'Adres bilgisi eksik.'}", "{selectedCustomer.address || t('esmm.noAddress')}"],
    [">Belge Tipi<", ">{t('esmm.docType')}<"],
    [">E-SERBEST MESLEK MAKBUZU<", ">{t('esmm.docTypeLabel')}<"],
    [">Para Birimi<", ">{t('esmm.currency')}<"],
    [">Düzenlenme<", ">{t('esmm.issueDate')}<"],
    [">Hizmet Açıklaması<", ">{t('esmm.thServiceDesc')}<"],
    [">Hesap Tipi<", ">{t('esmm.thCalcType')}<"],
    [">Girilen Tutar<", ">{t('esmm.thEnteredAmt')}<"],
    [">GV (%)<", ">{t('esmm.thGv')}<"],
    [">KDV (%)<", ">{t('esmm.thVat')}<"],
    [">Çıkan Sonuç<", ">{t('esmm.thResult')}<"],
    ["placeholder=\"Örn: Haziran Ayı Mali Müşavirlik Hizmeti\"", "placeholder={t('esmm.pHint')}"],
    [">Brütten<", ">{t('esmm.grossMode')}<"],
    [">Netten<", ">{t('esmm.netMode')}<"],
    ["> YENİ HİZMET EKLE<", "> {t('esmm.btnAddLine')}<"],
    ["Serbest Meslek Makbuzunda Tahsil Edilen Net = Brüt + KDV - Stopaj Formülü Uygulanır", "{t('esmm.formulaHint')}"],
    [">Açıklama / IBAN Bilgileri<", ">{t('esmm.noteLabel')}<"],
    ["placeholder=\"Ödemenin yapılacağı hesap bilgileri vb...\"", "placeholder={t('esmm.notePlaceholder')}"],
    [">Brüt Ücret (Hizmet Bedeli)<", ">{t('esmm.grossFee')}<"],
    [">(-) Gelir Vergisi (Stopaj)<", ">{t('esmm.gvLabel')}<"],
    [">(+) KDV Hesaplanan<", ">{t('esmm.vatCalc')}<"],
    [">TAHSİL EDİLECEK NET<", ">{t('esmm.netCollected')}<"],
    [">Para Giriş Yönü<", ">{t('esmm.cashFlowIn')}<"],
    [">Makbuz Tahsilatı<", ">{t('esmm.receiptCollection')}<"],
    ["> Nakit<", "> {t('esmm.btnCash')}<"],
    ["> Havale<", "> {t('esmm.btnTransfer')}<"],
    ["> CariHesap<", "> {t('esmm.btnDeferred')}<"],
    ["> TASLAK OLARAK KAYDET<", "> {t('esmm.btnDraft')}<"],
    [">TASLAK<", ">{t('esmm.btnDraftShort')}<"],
    ["'BEKLEYİNİZ...' : 'E-SMM OLUŞTUR'", "t('esmm.btnWait') : t('esmm.btnCreate')"]
];

for (const [search, replace] of replacements) {
    file = file.replaceAll(search, replace);
}

fs.writeFileSync('src/components/terminal/ESMMWorkspace.tsx', file);
console.log('ESMMWorkspace i18n applied!');
