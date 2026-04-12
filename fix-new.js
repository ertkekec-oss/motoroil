const fs = require('fs');

// ==== 1. Fix GlobalReportHeader
let gPath = 'src/components/reports/GlobalReportHeader.tsx';
let gCode = fs.readFileSync(gPath, 'utf8');

// Replace the round pills with staff-like inputs: rounded-[8px] h-[36px]
gCode = gCode.replace(/px-5 py-2\.5 rounded-full/g, 'px-3 h-[36px] rounded-[8px]');
gCode = gCode.replace(/px-4 py-2\.5 rounded-full/g, 'px-3 h-[36px] rounded-[8px]');
gCode = gCode.replace(/bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md px-5 py-2\.5/g, 'bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold shadow-sm px-4 h-[36px]');
fs.writeFileSync(gPath, gCode);

// ==== 2. Fix profitability metrics
let pPath = 'src/app/(app)/reports/finance/profitability/page.tsx';
let pCode = fs.readFileSync(pPath, 'utf8');

const pMetricsMatch = pCode.match(/<div className="flex flex-wrap items-center gap-4 mb-8">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (pMetricsMatch) {
    const pMetricsNew = `<div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[240px]">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-[14px]">💰</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOPLAM CİRO</div>
                        <div className="text-[16px] font-black leading-none text-slate-900 dark:text-white mt-0.5">₺825,000</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[240px]">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center text-[14px]">📉</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SATILAN MALİYET (COGS)</div>
                        <div className="text-[16px] font-black leading-none text-red-600 dark:text-red-400 mt-0.5">₺487,000</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[240px]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[14px]">📈</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BRÜT KAR (Gross Profit)</div>
                        <div className="text-[16px] font-black leading-none text-emerald-600 dark:text-emerald-400 mt-0.5">₺338,000</div>
                    </div>
                </div>
            </div>`;
    pCode = pCode.replace(pMetricsMatch[0], pMetricsNew);
    fs.writeFileSync(pPath, pCode);
}

// ==== 3. Fix conversion metrics
let cPath = 'src/app/(app)/reports/sales/conversion/page.tsx';
let cCode = fs.readFileSync(cPath, 'utf8');

const cMetricsMatch = cCode.match(/<div className="flex flex-wrap items-center gap-4 mb-8">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
if (cMetricsMatch) {
    const cMetricsNew = `<div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[14px]">🎯</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KAZANILAN (WON)</div>
                        <div className="text-[16px] font-black leading-none text-slate-900 dark:text-white mt-0.5">{totalWon}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center text-[14px]">👎</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KAYBEDİLEN (LOST)</div>
                        <div className="text-[16px] font-black leading-none text-red-600 dark:text-red-400 mt-0.5">{totalLost}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-[14px]">📈</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ŞİRKET ÇEVRİM ORANI</div>
                        <div className="text-[16px] font-black leading-none text-blue-600 dark:text-blue-400 mt-0.5">%{avgConversion}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm min-w-[220px]">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center text-[14px]">⚠️</div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KAYBOLAN CİRO RİSKİ</div>
                        <div className="text-[16px] font-black leading-none text-orange-600 dark:text-orange-400 mt-0.5">₺3.0M</div>
                    </div>
                </div>
            </div>`;
    cCode = cCode.replace(cMetricsMatch[0], cMetricsNew);
    fs.writeFileSync(cPath, cCode);
}
