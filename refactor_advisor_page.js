import fs from 'fs';
import path from 'path';

const file = 'src/app/(app)/advisor/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

const newHeader = `
            {/* Header Redesign: Strategic Zone */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-[6px]">FINANCE MODULE</span>
                    </div>
                    <h1 className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                        Financial Command Center
                    </h1>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">
                        Resmi muhasebe kayıtları, hesap planı ve finansal yönetişim paneli.
                    </p>
                </div>
                {/* Contextual Action Bar */}
                <div className="flex items-center gap-3">
                    <button className="h-[44px] px-6 rounded-[12px] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                        Geçmiş Dönem
                    </button>
                    <button className="h-[44px] px-6 rounded-[12px] bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-all">
                        Yeni Rapor Oluştur
                    </button>
                </div>
            </header>

            {/* Navigation Zone v2 */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 w-full overflow-x-auto custom-scroll select-none">
                <div className="flex h-[48px] items-end gap-8 px-2 w-full min-w-max">
                    {[
                        { id: 'checks', label: 'Çek & Senet' },
                        { id: 'health', label: 'Finans' },
                        { id: 'plan', label: 'Hesap Planı' },
                        { id: 'mizan', label: 'Genel Mizan' },
                        { id: 'income', label: 'Gelir Tablosu' },
                        { id: 'vat', label: 'KDV Simülasyonu' },
                        { id: 'babs', label: 'BA/BS' },
                        { id: 'audit', label: 'Denetim' },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={\`pb-3 text-[14px] font-semibold transition-all relative whitespace-nowrap \${
                                    isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }\`}
                            >
                                {tab.label}
                                {isActive && (
                                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
`;

txt = txt.replace(/<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">[\s\S]*?<\/div>\s*<\/div>/, newHeader.trim());
txt = txt.replace(/<div className="p-6 md:p-8 animate-in fade-in zoom-in-95 font-sans text-white">/g, '<div className="p-6 md:p-10 animate-in fade-in duration-500 font-sans min-h-screen bg-[#F6F8FB] dark:bg-[#0F172A] text-slate-900 dark:text-white">');
txt = txt.replace(/mt-4/g, "gap-y-8 flex flex-col pt-4");

fs.writeFileSync(file, txt, 'utf8');
console.log('Advisor Page header refactored.');
