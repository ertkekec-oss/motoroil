const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
    /<div className="p-5 flex-1   bg-surface dark:bg-\\[#0f172a\\]">/g,
    '<div className="p-6 flex-1 bg-white dark:bg-[#0f172a]">'
);
c = c.replace(
    /Aksiyon verileri işleniyor\.\.\.<\/div>\r?\n\s*\)\s*:\s*report\?\.error\s*\?\s*\(\r?\n\s*<div className="py-8 text-center text-\[10px\] font-black uppercase tracking-widest text-state-alert-text bg-state-alert-bg\/30 rounded-sm border-none">/g,
    'Aksiyon verileri işleniyor...</div>\n                        ) : report?.error ? (\n                            <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl">'
);
c = c.replace(
    /<div className="py-12 text-center text-\[10px\] font-black uppercase tracking-widest text-text-muted">/g,
    '<div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">'
);
c = c.replace(
    /<div className="grid grid-cols-1 md:grid-cols-3 gap-4">/g,
    '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">'
);
c = c.replace(
    /<div className="bg-white dark:bg-\[#1e293b\]\/50 px-5 py-3 rounded-\[100px\] shadow-none ring-0 ring-0-100 flex items-center gap-4">/g,
    '<div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 flex flex-col gap-2">'
);
c = c.replace(
    /<div className="bg-white dark:bg-\[#1e293b\]\/50 px-5 py-3 rounded-\[100px\] shadow-none border-none ring-0 flex items-center gap-4">/g,
    '<div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 flex flex-col gap-2">'
);
c = c.replace(
    /<div className="text-\[9px\] font-black uppercase tracking-widest text-text-muted">/g,
    '<div className="text-[10px] font-black uppercase tracking-widest text-slate-400">'
);
c = c.replace(
    /<div className="text-\[18px\] font-black text-text-primary dark:text-white mb-1">/g,
    '<div className="text-[20px] font-black text-slate-800 dark:text-white mt-2">'
);
c = c.replace(
    /<div className="text-\[10px\] font-bold text-text-secondary uppercase tracking-widest">/g,
    '<div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">'
);

// Variables for Payroll View
let p_rep = `<SoftContainer className="min-h-[400px]" title="Geçmiş Bordro ve Hakedişlerim" icon={<DollarSign className="w-4 h-4" />}>`;
c = c.replace(/<EnterpriseCard className="no-print border-none ring-0 shadow-sm rounded-\[32px\]">/, p_rep);
c = c.replace(/<EnterpriseSectionHeader title="Geçmiş Bordro ve Hakedişlerim" icon="📜" \/>/, '');
// find closing tag for the payroll view card
c = c.replace(/<\/div>\r?\n\s*<\/EnterpriseCard>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*\);\r?\n};\r?\n\r?\n\/\/ ─── SHIFTS VIEW/g, '</div>\n            </SoftContainer>\n        </div>\n    );\n};\n\n// ─── SHIFTS VIEW');

fs.writeFileSync(f, c);
console.log('done modifying via regex script');
