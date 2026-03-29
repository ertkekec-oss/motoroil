const fs = require('fs');
let txt = fs.readFileSync('src/app/(app)/staff/me/page.tsx', 'utf8');

// 1. DÜŞMANIMIZ OLAN TÜM ÇİZGİLER VE HALKALAR (RINGS & BORDERS)
txt = txt.replace(/ring-1 ring-slate-100 dark:ring-white\/10/g, 'border-none ring-0');
txt = txt.replace(/ring-1 ring-slate-100 dark:ring-white\/5/g, 'border-none ring-0');
txt = txt.replace(/ring-1 ring-slate-100/g, 'border-none ring-0');
txt = txt.replace(/ring-[a-z0-9\/]+/g, 'ring-0'); // Her türlü ring'i yok et
txt = txt.replace(/dark:ring-white\/[0-9]+/g, 'ring-0'); // Karanlık mod beyaz yüzükleri sök
txt = txt.replace(/shadow-sm/g, 'shadow-none');
txt = txt.replace(/shadow-md/g, 'shadow-none');
txt = txt.replace(/shadow-\[.*?\]/g, 'shadow-none');
txt = txt.replace(/border-none border-none/g, 'border-none'); 

// 2. KART ARKA PLANLARINI DAHA YUMUŞAK YAP VE RADYANINI BÜYÜT (Reference'daki Box)
// Referansta (Hedefler vb.) kutular köşesiz adeta ve iç mekan uyumlu.
txt = txt.replace(/bg-white dark:bg-\[\#1e293b\]/g, 'bg-white dark:bg-[#1e293b]/50');
txt = txt.replace(/rounded-\[24px\]/g, 'rounded-[32px]');

// 3. TABLARDAKİ AŞIRI KENARLAR (Reference Tab yapısı: hiçbir border/ring olmayacak, arka plan hafif soft gri/siyah)
const tabsRegex = /className=\{activeTab === tab\.id[\s\S]*?\}/g;
txt = txt.replace(tabsRegex, `className={activeTab === tab.id
                                ? "px-5 py-2 text-[12px] font-bold text-slate-800 dark:text-white bg-white dark:bg-white/5 rounded-lg transition-all border-none ring-0 shadow-none"
                                : "px-5 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all rounded-lg border-none ring-0 shadow-none"
                            }`);

// 4. KUTU İÇİ KUTU ("PENCERE") BAŞLIKLARINI DÜZLE (PDKS DOĞRULAMASI vs)
// Şu an: <div className="bg-slate-50 dark:bg-[#0f172a] px-5 py-4 border-none text-[10px] ... flex items-center justify-between">
// Olması gereken: İç içe kutu görünümünden uzaklaştırmak için paddingli düz div.
txt = txt.replace(
  /<div className="bg-slate-50 dark:bg-\[\#0f172a\] px-5 py-4 border-none text-\[10px\] font-black uppercase tracking-widest text-text-primary flex items-center justify-between">/g,
  '<div className="flex items-center justify-between mb-6">'
);
txt = txt.replace(
  /<div className="bg-slate-50 dark:bg-\[\#0f172a\] px-5 py-4 border-none text-\[10px\] font-black uppercase tracking-widest text-text-primary flex items-center gap-2">/g,
  '<div className="flex items-center gap-2 mb-6">'
);

// Pencerelerin başlık yazıları artık düz bir metin olmalı: (Örn: <h3 ...><IconZap/> PDKS DOĞRULAMASI</h3>)
txt = txt.replace(/<h3 className="flex items-center gap-2">/g, '<h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">');

// 5. PDKS TUŞLARI İÇİNDEKİ BORDERLAR VE KUSURLU ŞEKİLLER
// Onların border-none olmasını sağlamak için custom style:
txt = txt.replace(
  /className="flex flex-col items-center justify-center gap-2 h-20 bg-surface-secondary hover:bg-surface-tertiary border border-default rounded-md outline-none transition-colors group"/g,
  'className="flex items-center justify-center gap-3 h-16 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[24px] outline-none transition-colors group border-none ring-0"'
);

// 6. TEPEDEKI (ÖZET/PDKS vb.) 4'LÜ HAPLARIN YAPISINI YENİDEN İNŞA ET (Referanstaki Toplam Personel vb.)
// Şu ankini bulup değiştireceğiz
const oldDashboardCardsRegex = /<div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">[\s\S]*?<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">/m;

const newTopPills = `<div className="flex flex-wrap items-center gap-3 shrink-0 mb-6 w-full">
                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-blue-500 shadow-sm border-none">
                            <IconActivity className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Günlük Cirom</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">₺{(turnover || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-emerald-500 shadow-sm border-none">
                            <IconTrendingUp className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Hedef (Ay)</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayAchievement}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-orange-500 shadow-sm border-none">
                            <IconClock className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Bekleyen Görev</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{activeTasksCount}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-purple-500 shadow-sm border-none">
                            <DollarSign className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Kazanılan Prim</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayBonus}</span>
                        </div>
                    </div>
                </div>

                {/* PDKS & Vardiya */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">`;
txt = txt.replace(oldDashboardCardsRegex, newTopPills);

fs.writeFileSync('src/app/(app)/staff/me/page.tsx', txt);
console.log('Tam tasarım temizliği yapıldı: Border, Ringler gitti ve haplar toplandı.');
