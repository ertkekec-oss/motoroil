const fs = require('fs');
let file = fs.readFileSync('src/components/terminal/B2BInvoiceWorkspace.tsx', 'utf8');

// Inject useLanguage hook
if (!file.includes('useLanguage')) {
    file = file.replace("import { useModal } from '@/contexts/ModalContext';", "import { useModal } from '@/contexts/ModalContext';\nimport { useLanguage } from '@/contexts/LanguageContext';");
    file = file.replace("const { showWarning, showSuccess } = useModal();", "const { showWarning, showSuccess } = useModal();\n    const { t } = useLanguage();");
}

// Map exact string replacements
const replacements = [
    ["E-Fatura Kesildi", "{t('invoice.successTitle')}"],
    ["Belge GİB kuyruğuna başarıyla eklendi. Müşteriye e-posta olarak otomatik iletilmiştir.", "{t('invoice.successDesc')}"],
    [">YENİ FATURA<", ">{t('invoice.btnNew')}<"],
    [">PDF OLARAK İNDİR<", ">{t('invoice.btnPdf')}<"],
    ["SAYIN / KURUM (ALICI)", "{t('invoice.buyerLabel')}"],
    ["Fatura Kesilecek Cari Ünvan veya Vergi No...", "{t('invoice.searchCustomer')}"],
    ["Son Kullanılan Cariler", "{t('invoice.recentCustomers')}"],
    ["Bakiye:", "{t('invoice.balance')}:"],
    ["Vergi D.", "{t('invoice.taxOffice')}"],
    [">Tanımsız<", ">{t('invoice.undefined')}<"],
    ["Cariyi Değiştir", "{t('invoice.changeCustomer')}"],
    ["'Belirtilmemiş'", "t('invoice.notSpecified')"],
    ["Kayıtlı açık adres bulunamadı. Fatura E-Arşiv olarak kesilecektir.", "{t('invoice.noAddress')}"],
    [">Fatura Tipi<", ">{t('invoice.invoiceType')}<"],
    [">SATIŞ FATURASI<", ">{t('invoice.typeSales')}<"],
    [">İADE FATURASI<", ">{t('invoice.typeReturn')}<"],
    [">TEVKİFATLI FATURA<", ">{t('invoice.typeTevkifat')}<"],
    [">İSTİSNA FATURASI<", ">{t('invoice.typeIstisna')}<"],
    [">Senaryo<", ">{t('invoice.scenario')}<"],
    [">TİCARİ FATURA<", ">{t('invoice.scenTicari')}<"],
    [">TEMEL FATURA<", ">{t('invoice.scenTemel')}<"],
    [">Döviz<", ">{t('invoice.currency')}<"],
    [">TCMB Kuru<", ">{t('invoice.tcmbRate')}<"],
    [">Düzenlenme Tarihi<", ">{t('invoice.issueDate')}<"],
    [">Şube / Kasa<", ">{t('invoice.branch')}<"],
    [">Merkez (Online)<", ">{t('invoice.branchMain')}<"],
    ["E-İRSALİYE / REFERANS EKLE", "{t('invoice.addDispatch')}"],
    [">İrsaliye Numarası<", ">{t('invoice.dispatchNo')}<"],
    ["16 Haneli Belge No", "{t('invoice.dispatchPlaceholder')}"],
    [">İrsaliye Tarihi<", ">{t('invoice.dispatchDate')}<"],
    [">Ürün / Hizmet Açıklaması<", ">{t('invoice.thDesc')}<"],
    [">Miktar<", ">{t('invoice.thQty')}<"],
    [">Birim Fiyat<", ">{t('invoice.thPrice')}<"],
    [">İsk.(%)<", ">{t('invoice.thDiscount')}<"],
    [">İstisna Kodu<", ">{t('invoice.thIsCode')}<"],
    [">Diğer Vergiler<", ">{t('invoice.thOtherTaxes')}<"],
    [">KDV(%)<", ">{t('invoice.thVat')}<"],
    [">Tevkifat<", ">{t('invoice.thTevkifat')}<"],
    [">Net Tutar<", ">{t('invoice.thNet')}<"],
    ["Açıklama veya ürün adı...", "{t('invoice.itemSearch')}"],
    ["🔍 Stok Arama Listesi", "{t('invoice.stockSearchList')}"],
    ["Stok Kartları (", "{t('invoice.stockCards')} ("],
    ["Stok:", "{t('invoice.stock')}:"],
    ["KDV:", "{t('invoice.vat')}:"],
    ["Sonuç bulunamadı.", "{t('invoice.notFound')}"],
    [">Ö.T.V Yok<", ">{t('invoice.otvNone')}<"],
    [">Yüzdesel ÖTV<", ">{t('invoice.otvPercent')}<"],
    [">Maktu (Birim)<", ">{t('invoice.otvAmount')}<"],
    [">Tutar/Oran:<", ">{t('invoice.otvAmountLabel')}<"],
    [">Tevkifatsız<", ">{t('invoice.tevkifatNone')}<"],
    [">10/10 (Tam)<", ">{t('invoice.tevkifatFull')}<"],
    ["YENİ SATIR EKLE", "{t('invoice.addLine')}"],
    [">Fatura Alt Notu<", ">{t('invoice.noteLabel')}<"],
    ["Banka IBAN bilgileri, teslimat notu vb...", "{t('invoice.notePlaceholder')}"],
    [">Mal / Hizmet Toplam Tutar<", ">{t('invoice.totSub')}<"],
    [">Toplam İskonto<", ">{t('invoice.totDisc')}<"],
    [">Hesaplanan KDV<", ">{t('invoice.totVat')}<"],
    [">Hesaplanan ÖTV<", ">{t('invoice.totOtv')}<"],
    [">Hesaplanan OİV<", ">{t('invoice.totOiv')}<"],
    [">(-) Tevkif Edilen KDV<", ">{t('invoice.totTevkifat')}<"],
    [">VERGİLER DAHİL TOPLAM<", ">{t('invoice.totGrand')}<"],
    [">Sistem (TL) Karşılığı<", ">{t('invoice.totSys')}<"],
    ["> TASLAK OLARAK KAYDET<", "> {t('invoice.btnDraft')}<"],
    [">TASLAK<", ">{t('invoice.btnDraftShort')}<"],
    ["'BEKLEYİNİZ...' : 'E-FATURALAŞTIR VE GÖNDER'", "t('invoice.btnWait') : t('invoice.btnSend')"]
];

for (const [search, replace] of replacements) {
    file = file.replaceAll(search, replace);
}

fs.writeFileSync('src/components/terminal/B2BInvoiceWorkspace.tsx', file);
console.log('B2BInvoiceWorkspace i18n applied!');
