const fs = require('fs');

// 1. Fix profitability
let pPath = 'src/app/(app)/reports/finance/profitability/page.tsx';
let pCode = fs.readFileSync(pPath, 'utf8');

const pMetricsOld = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">TOPLAM CİRO</div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">₺825,000</div>
                    <div className="text-xs font-semibold text-emerald-500 mt-2 block">+14% geçen periyoda göre</div>
                </div>
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">SATILAN MALİYET (COGS)</div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">₺487,000</div>
                    <div className="text-xs font-semibold text-red-500 mt-2 block">+5% geçen periyoda göre</div>
                </div>
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm">
                    
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">BRÜT KAR (Gross Profit)</div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₺338,000</div>
                    <div className="text-xs font-black text-emerald-500 mt-2 block border border-emerald-200 dark:border-slate-200 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded inline-block">
                        Marj: %40.9
                    </div>
                </div>
            </div>`;

const pMetricsNew = `<div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 py-2.5 px-6 rounded-full flex items-center justify-between shadow-sm min-w-[280px]">
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">TOPLAM CİRO</div>
                        <div className="text-[18px] font-black leading-none text-slate-900 dark:text-white">₺825,000</div>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">+14%</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 py-2.5 px-6 rounded-full flex items-center justify-between shadow-sm min-w-[280px]">
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">SATILAN MALİYET (COGS)</div>
                        <div className="text-[18px] font-black leading-none text-red-600 dark:text-red-400">₺487,000</div>
                    </div>
                    <div className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">+5%</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-emerald-200/50 dark:border-white/5 py-2.5 px-6 rounded-full flex items-center justify-between shadow-sm min-w-[300px]">
                    <div>
                        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">BRÜT KAR (Gross Profit)</div>
                        <div className="text-[18px] font-black leading-none text-emerald-600 dark:text-emerald-400">₺338,000</div>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">Marj: %40.9</div>
                </div>
            </div>`;

pCode = pCode.replace(pMetricsOld, pMetricsNew);
fs.writeFileSync(pPath, pCode);

// 2. Fix conversion
let cPath = 'src/app/(app)/reports/sales/conversion/page.tsx';
let cCode = fs.readFileSync(cPath, 'utf8');

const cMetricsOld = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-emerald-500 mb-3">
                        <Target className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">KAZANILAN (WON)</div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{totalWon}</div>
                    <div className="text-xs font-semibold text-emerald-500 mt-2 block">Başarıyla onaylanan</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-red-500 mb-3">
                        <ThumbsDown className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70 dark:text-red-400">KAYBEDİLEN (LOST)</div>
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">{totalLost}</div>
                    <div className="text-xs font-semibold text-red-500/70 mt-2 block">Reddedilen veya zaman aşımı</div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-blue-500 mb-3">
                        <TrendingUp className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ŞİRKET ÇEVRİM ORANI</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">%{avgConversion}</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                        <div className="\`h-full rounded-full bg-blue-500\`" style={{ width: \`\${avgConversion}%\` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] p-6 shadow-sm flex flex-col justify-between ">
                    <div className="flex items-center gap-3 text-amber-500 mb-3">
                        <HandCoins className="w-5 h-5" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">KAYBOLAN CİRO RİSKİ</div>
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-500">₺3.0M</div>
                    <div className="text-xs font-semibold text-slate-400 mt-2 block">Kaybedilen teklif toplamı</div>
                </div>
            </div>`;

const cMetricsNew = `<div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 py-2.5 px-6 rounded-full flex items-center gap-4 shadow-sm min-w-[260px]">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Target size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">KAZANILAN (WON)</div>
                        <div className="text-[18px] font-black leading-none text-slate-900 dark:text-white">{totalWon}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 py-2.5 px-6 rounded-full flex items-center gap-4 shadow-sm min-w-[260px]">
                    <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center">
                        <ThumbsDown size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">KAYBEDİLEN (LOST)</div>
                        <div className="text-[18px] font-black leading-none text-red-600 dark:text-red-400">{totalLost}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 py-2.5 px-6 rounded-full flex items-center gap-4 shadow-sm min-w-[260px]">
                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <TrendingUp size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">ŞİRKET ÇEVRİM ORANI</div>
                        <div className="text-[18px] font-black leading-none text-blue-600 dark:text-blue-400">%{avgConversion}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 py-2.5 px-6 rounded-full flex items-center gap-4 shadow-sm min-w-[260px]">
                    <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <HandCoins size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">KAYBOLAN CİRO RİSKİ</div>
                        <div className="text-[18px] font-black leading-none text-orange-600 dark:text-orange-400">₺3.0M</div>
                    </div>
                </div>
            </div>`;

// Using Regex to find and replace the conversion metrics block smoothly to avoid whitespace string mismatches
cCode = cCode.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">[\s\S]*?className="text-xs font-semibold text-slate-400 mt-2 block">Kaybedilen teklif toplamı<\/div>\s*<\/div>\s*<\/div>/, cMetricsNew);

fs.writeFileSync(cPath, cCode);
