const fs = require('fs');

let file = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

const TR_INVOICE_APPEND = `
            errCustomer: "Cari Seçimi Eksik",
            errCustomerDesc: "Fatura kesebilmek için lütfen Cari Hesap seçiniz.",
            errEmpty: "Fatura Boş",
            errEmptyDesc: "Lütfen en az bir ürün/hizmet ekleyiniz.",
            successGib: "E-Fatura Başarıyla GİB'e İletildi",
            invNoLabel: "Fatura Numarası:",
            placeholderIstisna: "Örn: 301",
`;

const EN_INVOICE_APPEND = `
            errCustomer: "Customer Selection Missing",
            errCustomerDesc: "Please select a Customer Account to create an invoice.",
            errEmpty: "Invoice Empty",
            errEmptyDesc: "Please add at least one product/service.",
            successGib: "E-Invoice Successfully Sent to GIB",
            invNoLabel: "Invoice Number:",
            placeholderIstisna: "e.g. 301",
`;

const DE_INVOICE_APPEND = `
            errCustomer: "Kundenauswahl Fehlt",
            errCustomerDesc: "Bitte wählen Sie ein Kundenkonto, um eine Rechnung zu erstellen.",
            errEmpty: "Rechnung Leer",
            errEmptyDesc: "Bitte fügen Sie mindestens ein Produkt/eine Dienstleistung hinzu.",
            successGib: "E-Rechnung erfolgreich an GIB gesendet",
            invNoLabel: "Rechnungsnummer:",
            placeholderIstisna: "z.B. 301",
`;

file = file.replace('        invoice: {\n            successTitle: "E-Fatura Kesildi",', '        invoice: {\n' + TR_INVOICE_APPEND + '            successTitle: "E-Fatura Kesildi",');
file = file.replace('        invoice: {\n            successTitle: "E-Invoice Issued",', '        invoice: {\n' + EN_INVOICE_APPEND + '            successTitle: "E-Invoice Issued",');
file = file.replace('        invoice: {\n            successTitle: "E-Rechnung erstellt",', '        invoice: {\n' + DE_INVOICE_APPEND + '            successTitle: "E-Rechnung erstellt",');

// Remove the newly added duplicated ones:
// TR block starts right after billingDesc: "Abonelik ücretleriniz aylık olarak tahakkuk ettirilir" (approx line 331)
const trNewInvoiceRegex = /        invoice: \{\s*errCustomer: "Cari Seçimi Eksik",[\s\S]*?placeholderIstisna: "Örn: 301"\s*\},\n        menu/g;
file = file.replace(trNewInvoiceRegex, '        menu');

// EN block starts right after billingDesc: "Your subscription fees are accrued monthly"
const enNewInvoiceRegex = /        invoice: \{\s*errCustomer: "Customer Selection Missing",[\s\S]*?placeholderIstisna: "e\.g\. 301"\s*\},\n        menu/g;
file = file.replace(enNewInvoiceRegex, '        menu');

// DE block starts right after billingDesc: "Ihre Abonnementgebühren fallen monatlich an"
const deNewInvoiceRegex = /        invoice: \{\s*errCustomer: "Kundenauswahl Fehlt",[\s\S]*?placeholderIstisna: "z\.B\. 301"\s*\},\n        menu/g;
file = file.replace(deNewInvoiceRegex, '        menu');

fs.writeFileSync('src/contexts/LanguageContext.tsx', file);
console.log('Duplication fixed');
