const fs = require('fs');

let file = fs.readFileSync('src/components/terminal/B2BInvoiceWorkspace.tsx', 'utf8');

const replacements = [
    ['showWarning("Cari Seçimi Eksik", "Fatura kesebilmek için lütfen Cari Hesap seçiniz.")', 'showWarning(t(\'invoice.errCustomer\'), t(\'invoice.errCustomerDesc\'))'],
    ['showWarning("Fatura Boş", "Lütfen en az bir ürün/hizmet ekleyiniz.")', 'showWarning(t(\'invoice.errEmpty\'), t(\'invoice.errEmptyDesc\'))'],
    ['`Fatura Numarası: ${new Date().getFullYear()}${(Math.random().toString(36).substring(2, 8).toUpperCase())}`', '`${t(\'invoice.invNoLabel\')} ${new Date().getFullYear()}${(Math.random().toString(36).substring(2, 8).toUpperCase())}`'],
    ['"E-Fatura Başarıyla GİB\'e İletildi"', 't(\'invoice.successGib\')'],
    ['<span className="hidden sm:inline">TASLAK OLARAK KAYDET</span>', '<span className="hidden sm:inline">{t(\'invoice.btnDraft\')}</span>'],
    ['placeholder="Örn: 301"', 'placeholder={t(\'invoice.placeholderIstisna\')}']
];

for (const [search, replace] of replacements) {
    file = file.replace(search, replace);
}

fs.writeFileSync('src/components/terminal/B2BInvoiceWorkspace.tsx', file);
console.log('B2BInvoiceWorkspace i18n applied!');
