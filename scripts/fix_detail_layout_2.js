const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const tabsToFix = [
    {
        name: 'Offers',
        emptyCond: '(!customer.offers || customer.offers.length === 0)',
        emptyMsg: 'Müşteriye henüz bir teklif oluşturulmamış.',
        cols: 5,
        searchStr: `                            {(!customer.offers || customer.offers.length === 0) ? (
                                <div style={{ padding: '40px', background: 'var(--bg-card, rgba(0,0,0,0.2))', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.5 }}>📝</div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>Teklif Bulunamadı</h4>
                                    Müşteriye henüz bir teklif oluşturulmamış.
                                </div>
                            ) : (`
    },
    {
        name: 'Checks',
        emptyCond: '(!customer.checks || customer.checks.length === 0)',
        emptyMsg: 'Kayıtlı evrak bulunmuyor.',
        cols: 2,
        searchStr: `                                    {!customer.checks || customer.checks.length === 0 ? (
                                        <div className="p-10 text-center bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-dashed border-slate-200 dark:border-white/10">
                                            <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>📑</div>
                                            <div style={{ color: 'var(--text-main, #fff)', fontSize: '14px', fontWeight: '600' }}>Kayıtlı evrak bulunmuyor.</div>
                                        </div>
                                    ) : (`
    },
    {
        name: 'Payment Plans',
        emptyCond: '(!customer.paymentPlans || customer.paymentPlans.length === 0)',
        emptyMsg: 'Aktif vadelendirme planı bulunmuyor.',
        cols: 2,
        searchStr: `                                    {!customer.paymentPlans || customer.paymentPlans.length === 0 ? (
                                        <div className="p-10 text-center bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-dashed border-slate-200 dark:border-white/10">
                                            <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>📅</div>
                                            <div style={{ color: 'var(--text-main, #fff)', fontSize: '14px', fontWeight: '600' }}>Aktif vadelendirme planı bulunmuyor.</div>
                                        </div>
                                    ) : (`
    },
    {
        name: 'Reconciliations',
        emptyCond: '(!customer.reconciliations || customer.reconciliations.length === 0)',
        emptyMsg: 'Bu cariyle henüz mutabakat yapılmamış.',
        cols: 4,
        searchStr: `                            {(!customer.reconciliations || customer.reconciliations.length === 0) ? (
                                <div className="p-10 text-center bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-dashed border-slate-200 dark:border-white/10">
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🤝</div>
                                    <div style={{ color: 'var(--text-main, #fff)', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Bu cariyle henüz mutabakat yapılmamış.</div>
                                    <button
                                        onClick={() => router.push('/reconciliation/list')}
                                        style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                        className="hover:bg-blue-500 hover:text-white"
                                    >
                                        Mevcut İşlemleri Gör
                                    </button>
                                </div>
                            ) : (`
    }
];

// Instead of string replacement which is brittle, logic string replacement based on `) : (` pattern:
data = data.replace(/\{\(!customer\.offers \|\| customer\.offers\.length === 0\) \? \([\s\S]*?Müşteriye henüz bir teklif oluşturulmamış\.[\s\S]*?<\/div>[\s\S]*?\) : \([\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>([\s\S]*?<\/thead>)\s*<tbody>/,
`<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
    <table className="w-full text-left border-collapse">
        <thead>$1
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(!customer.offers || customer.offers.length === 0) ? (<tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Teklif Bulunamadı. Müşteriye henüz bir teklif oluşturulmamış.</td></tr>) : (`);

// Reconciliations
data = data.replace(/\{\(!customer\.reconciliations \|\| customer\.reconciliations\.length === 0\) \? \([\s\S]*?Bu cariyle henüz mutabakat yapılmamış\.[\s\S]*?<\/div>\s*\) : \([\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>([\s\S]*?<\/thead>)\s*<tbody>/,
`<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
    <table className="w-full text-left border-collapse">
        <thead>$1
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(!customer.reconciliations || customer.reconciliations.length === 0) ? (<tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Bu cariyle henüz mutabakat yapılmamış.</td></tr>) : (`);

// Checks
data = data.replace(/\{!customer\.checks \|\| customer\.checks\.length === 0 \? \([\s\S]*?Kayıtlı evrak bulunmuyor\.[\s\S]*?<\/div>\s*\) : \([\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>([\s\S]*?<\/thead>)\s*<tbody>/,
`<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
    <table className="w-full text-left border-collapse">
        <thead>$1
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(!customer.checks || customer.checks.length === 0) ? (<tr><td colSpan={2} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Kayıtlı evrak bulunmuyor.</td></tr>) : (`);

// Payment Plans
data = data.replace(/\{!customer\.paymentPlans \|\| customer\.paymentPlans\.length === 0 \? \([\s\S]*?Aktif vadelendirme planı bulunmuyor\.[\s\S]*?<\/div>\s*\) : \([\s\S]*?<table className="w-full text-left border-collapse">\s*<thead>([\s\S]*?<\/thead>)\s*<tbody>/,
`<div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
    <table className="w-full text-left border-collapse">
        <thead>$1
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(!customer.paymentPlans || customer.paymentPlans.length === 0) ? (<tr><td colSpan={2} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Aktif vadelendirme planı bulunmuyor.</td></tr>) : (`);

// Warranties Empty State is different because it uses cards, not tables:
data = data.replace(
    /\{warranties\.length === 0 \? \([\s\S]*?Henüz kayıtlı garanti karnesi bulunmuyor\.[\s\S]*?<\/div>\s*\) : \(/,
    `{warranties.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Henüz kayıtlı garanti karnesi bulunmuyor.
                                </div>
                            ) : (`
);

// Documents Empty State
data = data.replace(
    /\{docsLoading \? \([\s\S]*?dosyası yüklenmemiş\.\s*\(Maks 5MB PDF, PNG, JPEG\)<\/div>\s*<\/div>\s*\) : \(/,
    `{docsLoading ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Dosyalar getiriliyor...
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Henüz dosyası yüklenmemiş. (Maks 5MB PDF, PNG, JPEG)
                                </div>
                            ) : (`
);

// Close out the ternary for those tables `</tbody> </table> </div>`
data = data.replace(/<\/tbody>\s*<\/table>\s*<\/div>\s*\)\}/g, `)}</tbody></table></div>`);
data = data.replace(/<\/tbody>\s*<\/table>\s*<\/div>\s*\)\s*\}/g, `)}</tbody></table></div>`);

// Change the huge green buttons for specific tabs to standard Staff outline style `bg-blue-600 hover:bg-blue-700 rounded-lg text-white ...` 
// Check: Mutabakat Başlat
data = data.replace(/className="btn btn-primary"\s*style=\{\{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient\(135deg, #10b981 0%, #059669 100%\)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba\(16, 185, 129, 0\.3\)' \}\}/,
    `className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);

// Check: Yeni Evrak Ekle
data = data.replace(/className="btn btn-primary"\s*style=\{\{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient\(135deg, #10b981 0%, #059669 100%\)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba\(16, 185, 129, 0\.3\)' \}\}/,
    `className="h-[36px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);

// Check: Yeni Teklif
data = data.replace(/style=\{\{ padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient\(135deg, #3b82f6 0%, #2563eb 100%\)', color: 'white', fontWeight: '800', textDecoration: 'none' \}\}/,
    `className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);

// Check: Garanti Başlat
data = data.replace(/className="btn btn-primary"\s*style=\{\{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient\(135deg, #3b82f6 0%, #2563eb 100%\)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba\(59, 130, 246, 0\.3\)' \}\}/,
    `className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);
// Dosya Yükle
data = data.replace(/className="btn btn-primary"\s*style=\{\{ cursor: uploading \? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: uploading \? 'var\(--bg-card\)' : 'linear-gradient\(135deg, #10b981 0%, #059669 100%\)', border: 'none', color: 'white', fontWeight: '800' \}\}/,
    `className="h-[36px] px-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"`
);


// 4. FIX THE EXPANDED ROW DARK MODE BUG
// Right now expanded row has `background: '#080a0f'`
data = data.replace(/<tr style=\{\{ background: '#080a0f', borderBottom: '1px solid var\(--border-color, rgba\(255,255,255,0\.03\)\)' \}\}>/g,
    `<tr className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5">`
);

fs.writeFileSync(file, data);
console.log('Phase 2 applied');
