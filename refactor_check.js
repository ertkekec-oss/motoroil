const fs = require('fs');

const file = 'src/components/CheckModule.tsx';
let txt = fs.readFileSync(file, 'utf8');

const newStats = `
            {/* 1. Strategic Metrics Zone (Unified Strip) */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-[24px] flex flex-col md:flex-row shadow-sm overflow-hidden mb-8">
                <div className="flex-1 p-6 relative group">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bekleyen Tahsilatlar</span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-[6px]">
                            ↑ Tahsilat
                        </div>
                    </div>
                    <div className="text-[32px] font-bold text-slate-900 dark:text-white leading-none mb-1">
                        {stats.inPending.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Portföydeki Alınan Çekler</div>
                </div>

                <div className="w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
                <div className="h-px w-full bg-slate-200 dark:bg-slate-800 block md:hidden" />

                <div className="flex-1 p-6 relative group">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bekleyen Ödemeler</span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-[6px]">
                            ↓ Ödeme
                        </div>
                    </div>
                    <div className="text-[32px] font-bold text-slate-900 dark:text-white leading-none mb-1">
                        {stats.outPending.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Vadesi Gelen Verilen Çekler</div>
                </div>

                <div className="w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
                <div className="h-px w-full bg-slate-200 dark:bg-slate-800 block md:hidden" />

                <div className="flex-1 p-6 flex flex-col justify-center">
                    <button onClick={() => setActiveTab('new')} className="w-full h-[52px] rounded-[12px] bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                        <span className="text-[18px]">+</span> Yeni Çek Gönder / Al
                    </button>
                </div>
            </div>

            {/* 2. Navigation Zone */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 w-full overflow-x-auto custom-scroll select-none">
                <div className="flex h-[48px] items-end gap-8 px-2 w-full min-w-max">
                    <button onClick={() => setActiveTab('list')} className={\`pb-3 text-[14px] font-semibold transition-all relative whitespace-nowrap \${activeTab === 'list' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}\`}>
                        Liste Görünümü
                        {activeTab === 'list' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                    </button>
                    <button onClick={() => setActiveTab('calendar')} className={\`pb-3 text-[14px] font-semibold transition-all relative whitespace-nowrap \${activeTab === 'calendar' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}\`}>
                         Vade Takvimi
                        {activeTab === 'calendar' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                    </button>
                </div>
            </div>
`;

txt = txt.replace(/<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newStats.trim());

// New Data form styles Fix
txt = txt.replace(/bg-black\/40/g, 'bg-white dark:bg-[#0f172a]');
txt = txt.replace(/focus:border-sky-500/g, 'focus:border-blue-600 dark:focus:border-blue-400 ring-0');
txt = txt.replace(/bg-sky-500 hover:bg-sky-600/g, 'bg-blue-600 hover:bg-blue-700');
txt = txt.replace(/text-sky-500/g, 'text-blue-600 dark:text-blue-400');
txt = txt.replace(/shadow-sky-500\/20/g, 'shadow-blue-500/20');
txt = txt.replace(/border-emerald-500\/20/g, 'border-slate-200 dark:border-slate-800');
txt = txt.replace(/bg-gradient-to-br from-emerald-500\/5 to-transparent/g, 'bg-white dark:bg-slate-800');
txt = txt.replace(/glass p-6/g, 'bg-white dark:bg-[#1e293b] p-6');
txt = txt.replace(/glass rounded-\[24px\]/g, 'bg-white dark:bg-[#1e293b] rounded-[24px]');

// Fix list table numeric alignments
txt = txt.replace(/<th className="p-6">TUTAR<\/th>/, '<th className="p-6 text-right">TUTAR</th>');
txt = txt.replace(/<span className="text-lg font-black text-slate-900 dark:text-white">([\s\S]*?)<\/span>/, '<span className="text-[14px] font-semibold text-slate-900 dark:text-white">$1</span>');

fs.writeFileSync(file, txt, 'utf8');
console.log('Check module refactored');
