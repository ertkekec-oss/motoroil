const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = [
    'CheckModule.tsx',
    'AccountPlanContent.tsx',
    'TrialBalanceContent.tsx',
    'IncomeStatementContent.tsx',
    'VatSimulationContent.tsx',
    'BaBsReconciliationContent.tsx',
    'FinancialHealthContent.tsx',
    'FinancialAuditContent.tsx',
];

const replaceRules = [
    // Background and Cards
    { match: /card glass/g, replace: "bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm" },
    { match: /bg-white\/5|bg-\[\#1a1f36\]/g, replace: "bg-slate-50 dark:bg-slate-800/50" },
    { match: /bg-white\/10/g, replace: "bg-slate-100 dark:bg-slate-800" },
    { match: /border-white\/10|border-white\/5|border-gray-800|border-gray-700/g, replace: "border-slate-200 dark:border-slate-800" },

    // Texts
    { match: /text-gray-400|text-gray-500|text-muted/g, replace: "text-slate-500 dark:text-slate-400" },
    { match: /text-gray-300|text-gray-200|text-white/g, replace: "text-slate-900 dark:text-white" },
    { match: /text-green-500|text-green-400/g, replace: "text-emerald-600 dark:text-emerald-400" },
    { match: /text-red-500|text-red-400/g, replace: "text-rose-600 dark:text-rose-400" },

    // Backgrounds for badges/buttons
    { match: /bg-green-500\/20/g, replace: "bg-emerald-50 dark:bg-emerald-500/10" },
    { match: /bg-red-500\/20/g, replace: "bg-rose-50 dark:bg-rose-500/10" },
    { match: /bg-yellow-500\/20/g, replace: "bg-amber-50 dark:bg-amber-500/10" },
    { match: /bg-blue-500\/20/g, replace: "bg-blue-50 dark:bg-blue-500/10" },
    { match: /bg-orange-500\/20|bg-orange-500\/10/g, replace: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },

    { match: /bg-gradient-to-r from-teal-400 to-cyan-500|bg-gradient-to-r from-orange-400 to-rose-400/g, replace: "text-slate-900 dark:text-white" },
    { match: /bg-clip-text text-transparent/g, replace: "" },

    // Modals
    { match: /rounded-xl/g, replace: "rounded-[12px]" },
    { match: /rounded-2xl|rounded-3xl/g, replace: "rounded-[24px]" },

    // Tables
    { match: /hover:bg-white\/5|hover:bg-slate-800\/50/g, replace: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" },
    { match: /py-3|py-4/g, replace: "py-4 text-[13px] h-[52px]" },
    { match: /th className="([^"]+)"/g, replace: (m, p1) => `th className="${p1.replace(/text-left/, 'text-left tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400')}"` },
];

files.forEach(f => {
    let filePath = path.join(dir, f);
    if (!fs.existsSync(filePath)) return;
    let txt = fs.readFileSync(filePath, 'utf8');

    replaceRules.forEach(r => {
        txt = txt.replace(r.match, r.replace);
    });

    txt = txt.replace(/text-2xl font-bold(\s+)/g, 'text-[24px] font-bold text-slate-900 dark:text-white$1');
    txt = txt.replace(/animate-fade-in-up/g, "animate-in fade-in duration-500");

    fs.writeFileSync(filePath, txt, 'utf8');
});

console.log('UI baseline refactored for Advisor components.');
