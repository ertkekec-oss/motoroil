const fs = require('fs');

const path = 'src/components/StaffManagementContent.tsx';
let txt = fs.readFileSync(path, 'utf8');

// 1. KPI Cards Değişimi
const oldStatsRegex = /\{\/\* --- STATS OVERVIEW ---\*\/\}[\s\S]*?\{\/\* --- TOOLBAR ---\*\/\}/;
const newStats = `{/* --- STATS OVERVIEW --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.03)] relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        Operasyonel Güç
                    </div>
                    <div className="text-4xl font-black text-white mb-1">{staff.length} <span className="text-sm font-medium text-white/40">Kişi Toplam</span></div>
                    <div className="text-[11px] text-white/50 font-medium">Sahada ve merkezde {staff.filter(s => s.status === 'Müsait').length} müsait personel.</div>
                </div>
                
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.03)] relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                    <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                        Aylık Performans Endeksi
                    </div>
                    <div className="text-4xl font-black text-white mb-1">%94 <span className="text-sm font-medium text-emerald-400">↑ Hedef Üstü</span></div>
                    <div className="text-[11px] text-white/50 font-medium">Geçen aya göre %12 verimlilik artışı.</div>
                </div>

                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.03)] relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-all"></div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0"></span>
                        İzin & Vardiya Durumu
                    </div>
                    <div className="text-4xl font-black text-white mb-1">{leaves.filter(l => l.status === 'Bekliyor').length} <span className="text-sm font-medium text-white/40">Bekleyen Talep</span></div>
                    <div className="text-[11px] text-white/50 font-medium">Şu an aktif izin kullanan 2 personel var.</div>
                </div>
            </div>

            {/* --- TOOLBAR --- */}`;
txt = txt.replace(oldStatsRegex, newStats);

// 2. Tab Navigation Değişimi
const oldTabsRegex = /<div className="flex bg-black\/20 p-1 rounded-xl overflow-x-auto">[\s\S]*?<\/div>/;
const newTabs = `<div className="flex bg-[#0f111a] border-b border-white/5 w-full overflow-x-auto select-none" style={{ borderRadius: '12px 12px 0 0' }}>
                    {[
                        { id: 'list', label: 'Personel Listesi' },
                        { id: 'roles', label: 'Roller & İzinler' },
                        { id: 'performance', label: 'Performans' },
                        { id: 'shifts', label: 'Vardiya' },
                        { id: 'leaves', label: 'İzinler' },
                        { id: 'attendance', label: 'PDKS' },
                        { id: 'puantaj', label: 'Puantaj' },
                        { id: 'payroll', label: 'Bordro' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={activeTab === tab.id
                                ? "px-6 py-4 text-[14px] font-semibold text-blue-400 whitespace-nowrap transition-all border-b-2 border-blue-500 group relative"
                                : "px-6 py-4 text-[14px] font-medium text-white/40 hover:text-white/80 whitespace-nowrap transition-all border-b-2 border-transparent"}
                            style={activeTab === tab.id ? { boxShadow: 'inset 0 -15px 15px -15px rgba(59, 130, 246, 0.2)' } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>`;
txt = txt.replace(oldTabsRegex, newTabs);

// 3. Toolbar Container Değişimi (Arama inputunu da premiumlaştır)
txt = txt.replace(/<div className="flex items-center gap-4 mb-8 bg-white\/5 p-2 rounded-2xl border border-white\/5">/, '<div className="flex items-center gap-4 mb-8 bg-[#0f111a] rounded-xl border border-white/5 overflow-hidden flex-col md:flex-row items-stretch">');
txt = txt.replace(/<div className="flex-1 relative">/, '<div className="flex-1 relative min-w-[300px] m-3">');

// 4. Staff Grid Değişimi
txt = txt.replace(/className="card glass p-6 border border-white\/5 hover:border-blue-500\/30\/30 transition-all group"/g, 'style={{ background: \'rgba(0, 0, 0, 0.4)\', backdropFilter: \'blur(12px)\' }} className="rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group shadow-lg"');
txt = txt.replace(/<h3 className="text-lg font-black text-white/g, '<h3 style={{ fontSize: \'18px\', fontWeight: 800 }} className="text-white tracking-tight');
txt = txt.replace(/<div className="text-xs text-white\/40 font-bold uppercase tracking-wide">\{person.role\} • \{person.branch\}<\/div>/g, '<div className="flex items-center gap-2 mt-2"><span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-white/50 uppercase border border-white/10">{person.role}</span><span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-white/50 uppercase border border-white/10">{person.branch}</span></div>');

// Butonları ghostlaştır (Düzenle, Görev Ata vb.)
txt = txt.replace(/bg-blue-500\/10 border border-blue-500\/30\/20 text-blue-500/g, 'bg-transparent text-white/60 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20');
txt = txt.replace(/bg-white\/5 border border-white\/10 text-\[10px\]/g, 'bg-transparent text-white/60 hover:text-white hover:bg-white/5 text-[10px] border-transparent');
txt = txt.replace(/bg-red-500\/10 border border-red-500\/20 text-red-500/g, 'bg-transparent text-white/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20');

// 5. İzinler ve Vardiya Data tablolarını round'laştır (Border Radius on rows) --> tbody divide-y yi border collapse'e dönüştürelim
// It's a bit hard to regex all tables safely. I will target the table element inside data switchers to add specific class if needed, or leave it mostly untouched as UI requested just "Ghost stil (yeşil/kırmızı tint)".
txt = txt.replace(/w-8 h-8 rounded-lg bg-emerald-500\/20 text-emerald-500 hover:bg-emerald-500 hover:text-white/g, 'w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20');
txt = txt.replace(/w-8 h-8 rounded-lg bg-red-500\/20 text-red-500 hover:bg-red-500 hover:text-white/g, 'w-8 h-8 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20');

fs.writeFileSync(path, txt);
console.log('Update script 2 completed successfully.');
