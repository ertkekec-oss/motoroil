const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// The incorrect replaces:
// `{(!customer.offers || customer.offers.length === 0) ? (...) : customer.offers.map((offer: any) => (`
// The map will close with `))} ` but since we used `{ (!... ? () : ...map(` it requires `))} }` at the end instead of `))} `.
// Instead of messing with the end, let's rewrite the syntax back to valid React patterns.

// Fix Offers
data = data.replace(
    /\{\(\!customer\.offers \|\| customer\.offers\.length === 0\) \? \(<tr><td colSpan=\{5\} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-\[14px\]">Teklif Bulunamadı\. Müşteriye henüz bir teklif oluşturulmamış\.<\/td><\/tr>\) : customer\.offers\.map\(\(offer: any\) => \(/g, 
    `{(!customer.offers || customer.offers.length === 0) && (<tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Teklif Bulunamadı. Müşteriye henüz bir teklif oluşturulmamış.</td></tr>)}\n{customer.offers && customer.offers.map((offer: any) => (`
);

// Fix Services
data = data.replace(
    /\{\(\!customer\.services \|\| customer\.services\.length === 0\) \? \(<tr><td colSpan=\{5\} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-\[14px\]">Kayıt Bulunamadı\. Müşteriye ait açık servis dosyası yok\.<\/td><\/tr>\) : customer\.services\.map\(\(service: any\) => \(/g,
    `{(!customer.services || customer.services.length === 0) && (<tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Kayıt Bulunamadı. Müşteriye ait açık servis dosyası yok.</td></tr>)}\n{customer.services && customer.services.map((service: any) => (`
);

// Fix Files/Documents (Let's check if there's a third one)
data = data.replace(
    /\{\(\!customer\.documents \|\| customer\.documents\.length === 0\) \? \(<tr><td colSpan=\{5\} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-\[14px\]">Dosya Bulunamadı\.<\/td><\/tr>\) : customer\.documents\.map\(\(doc: any\) => \(/g,
    `{(!customer.documents || customer.documents.length === 0) && (<tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Dosya Bulunamadı.</td></tr>)}\n{customer.documents && customer.documents.map((doc: any) => (`
);

fs.writeFileSync(file, data);
console.log('Customer Detail Bracket Fix Applied');
