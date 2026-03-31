const fs = require('fs');

const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

// The original file has `))} ` at the end of the map.
// Because we changed the map start to a ternary operator starting with `{`, we must close it with `}`.
// So: `))} ` -> `))} } `

// We will explicitly do this 3 times because there were 3 errors (TS1381).
// Offers
data = data.replace(
    /\}\)\)\s*\n\s*<\/tbody>\s*\n\s*<\/table>\s*\n\s*<\/div>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*\) : activeTab === 'reconciliation'/, 
    `})))}\n                                        </tbody>\n                                    </table>\n                                </div>\n                            )}\n                        </div>\n                    ) : activeTab === 'reconciliation'`
);
// Wait, the match is `))} ` followed by `</tbody>`.
// Actually, `))} ` is just `)` for `(offer: any) => (`, `)` for `map(`, and `}` for the whole `{` ternary.
// Wait! `map(` has `(`. `(offer: any) => (` has `(`.
// So `)` closes the arrow function body. `)` closes the `map(`.
// Then `}` closes the JSX embedding expression `{`!
// So it SHOULD BE: `))}` !
// Is there a TYPO in `CustomerDetailClient.tsx` where it actually HAS `))}` but it NEEDS `))}`?!
// What if the original WAS `))}` but since the JSX expression started with `{`, we only need ONE `}`.
// `{ condition ? a : map(x => ( <tr/> ))}`
// The opening is `{ condition ? a : map(x => ( `
// The closing is `) ) }`.
// Wait... if it is `) ) }`, that perfectly closes `map(`, `=> (`, and `{`.
// SO WHY IS THERE A SYNTAX ERROR AT LINE 1234 (`)}`)?!
// Let's rewrite the syntax to be absolutely standard and unambiguous.
const cleanOffers = `
{(!customer.offers || customer.offers.length === 0) && (
    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Teklif Bulunamadı. Müşteriye henüz bir teklif oluşturulmamış.</td></tr>
)}
{customer.offers && customer.offers.length > 0 && customer.offers.map((offer: any) => (
`;
data = data.replace(
    /\{\(\!customer\.offers \|\| customer\.offers\.length === 0\) \? \(<tr><td colSpan=\{5\} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-\[14px\]">Teklif Bulunamadı\. Müşteriye henüz bir teklif oluşturulmamış\.<\/td><\/tr>\) : customer\.offers\.map\(\(offer: any\) => \(/g, 
    cleanOffers
);

const cleanServices = `
{(!customer.services || customer.services.length === 0) && (
    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Kayıt Bulunamadı. Müşteriye ait açık servis dosyası yok.</td></tr>
)}
{customer.services && customer.services.length > 0 && customer.services.map((service: any) => (
`;
data = data.replace(
    /\{\(\!customer\.services \|\| customer\.services\.length === 0\) \? \(<tr><td colSpan=\{5\} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-\[14px\]">Kayıt Bulunamadı\. Müşteriye ait açık servis dosyası yok\.<\/td><\/tr>\) : customer\.services\.map\(\(service: any\) => \(/g,
    cleanServices
);

const cleanDocs = `
{(!customer.documents || customer.documents.length === 0) && (
    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Dosya Bulunamadı.</td></tr>
)}
{customer.documents && customer.documents.length > 0 && customer.documents.map((doc: any) => (
`;
data = data.replace(
    /\{\(\!customer\.documents \|\| customer\.documents\.length === 0\) \? \(<tr><td colSpan=\{5\} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-\[14px\]">Dosya Bulunamadı\.<\/td><\/tr>\) : customer\.documents\.map\(\(doc: any\) => \(/g,
    cleanDocs
);

fs.writeFileSync(file, data);
console.log('Customer Detail Ternary Fix Applied Correctly');
