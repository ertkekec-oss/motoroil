const fs = require('fs');

function refactorIncomeStatement() {
    let file = 'src/components/IncomeStatementContent.tsx';
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file, 'utf8');

    // Remove gradient from header
    txt = txt.replace(/text-slate-900 dark:text-white\s+bg-gradient-to-r from-emerald-400 to-cyan-500/g, 'text-slate-900 dark:text-white');

    // Adjust colors to corporate
    txt = txt.replace(/text-emerald-300|text-emerald-400|text-orange-400/g, 'text-slate-900 dark:text-white font-bold');
    txt = txt.replace(/text-rose-400|text-rose-500/g, 'text-rose-600 dark:text-rose-400 font-bold');

    // Adjust final NET PROFIT section
    txt = txt.replace(/bg-emerald-500\/10 border-emerald-500\/30/g, 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30');
    txt = txt.replace(/bg-rose-500\/10 border-rose-500\/30/g, 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30');

    fs.writeFileSync(file, txt, 'utf8');
}

function refactorBaBs() {
    let file = 'src/components/BaBsReconciliationContent.tsx';
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file, 'utf8');

    // gradients
    txt = txt.replace(/bg-gradient-to-r from-purple-400 to-pink-600/g, '');

    // theads
    txt = txt.replace(/<thead className="bg-[#1a1f36] text-gray-400 border-b border-gray-800 font-bold">/g, '<thead className="bg-[#F6F8FB] dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 font-bold sticky top-0 z-10">');
    // adjust THs
    txt = txt.replace(/<th className="([^"]+)">/g, (m, c) => {
        if (!c.includes('p-4')) return m;
        return `<th className="p-4 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400 ${c.includes('text-right') ? 'text-right' : 'text-left'}">`;
    });

    // TRs inside TBODY
    txt = txt.replace(/<tr key=\{row\.id\} className="border-b border-gray-800 hover:bg-white\/5 transition-colors">/g, '<tr key={row.id} className="h-[52px] border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">');

    txt = txt.replace(/<td className="p-4 font-bold text-white">/g, '<td className="px-4 py-2 font-semibold text-[13px] text-slate-900 dark:text-white">');
    txt = txt.replace(/<td className="p-4 text-gray-300">/g, '<td className="px-4 py-2 text-[13px] text-slate-900 dark:text-white">');
    txt = txt.replace(/<td className="p-4 text-right font-mono text-white text-lg font-bold">/g, '<td className="px-4 py-2 text-right font-mono font-semibold text-[14px] text-slate-900 dark:text-white">');

    fs.writeFileSync(file, txt, 'utf8');
}

function refactorAudit() {
    let file = 'src/components/FinancialAuditContent.tsx';
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file, 'utf8');

    // gradients
    txt = txt.replace(/bg-gradient-to-r from-red-400 to-orange-500/g, '');

    // theads
    txt = txt.replace(/<thead className="bg-slate-50 dark:bg-slate-800\/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">/g, '<thead className="bg-[#F6F8FB] dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 font-bold sticky top-0 z-10">');

    // adjust THs
    txt = txt.replace(/<th className="([^"]+)">/g, (m, c) => {
        if (!c.includes('p-4')) return m;
        return `<th className="p-4 tracking-wider uppercase text-[12px] font-semibold text-slate-500 dark:text-slate-400">`;
    });

    // row padding
    txt = txt.replace(/<td className="p-4/g, '<td className="px-4 py-3 text-[13px]');

    fs.writeFileSync(file, txt, 'utf8');
}

function refactorVat() {
    let file = 'src/components/VatSimulationContent.tsx';
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file, 'utf8');

    // gradients
    txt = txt.replace(/bg-gradient-to-r from-orange-400 to-red-500/g, '');

    // cards
    txt = txt.replace(/card bg-gradient-to-r from-rose-900\/50 to-red-900\/50/g, 'bg-rose-50 border border-rose-200 dark:bg-rose-900/10 dark:border-rose-500/30 rounded-[20px]');
    txt = txt.replace(/card bg-gradient-to-r from-emerald-900\/50 to-green-900\/50/g, 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-500/30 rounded-[20px]');

    txt = txt.replace(/text-rose-100/g, 'text-rose-700 dark:text-rose-100');
    txt = txt.replace(/text-emerald-100/g, 'text-emerald-700 dark:text-emerald-100');

    txt = txt.replace(/text-blue-300/g, 'text-blue-600 dark:text-blue-400');
    txt = txt.replace(/text-rose-300/g, 'text-rose-600 dark:text-rose-400');

    fs.writeFileSync(file, txt, 'utf8');
}

refactorIncomeStatement();
refactorBaBs();
refactorAudit();
refactorVat();

console.log('Tables, Headers and other small details refactored.');
