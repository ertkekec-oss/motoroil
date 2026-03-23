"use client";

import { useState, useEffect } from "react";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";
import { Network, ArrowRightLeft, Database, CheckCircle2, AlertCircle } from "lucide-react";

export default function CategoryMappingPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulasyon loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubCatalogTabs />

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Network className="w-7 h-7 text-indigo-600 dark:text-indigo-400 p-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg" />
                        Ağ Kategori Haritalama (Mapping Engine)
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">
                        Kendi muhasebe/ERP sisteminizdeki lokal kategorilerinizi, Periodya B2B Global Kategori ağacına eşleştirin. Böylece ürünleriniz B2B keşfet ekranlarında doğru sınıflandırmayla global satıcılara ulaşabilir.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400">
                                <Database className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">LOKAL (ERP)</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">124</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Sisteminizdeki Klasör/Kategori</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded uppercase tracking-widest">Haritalandı</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">98</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1 relative z-10">Global'e Eşleşen</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded uppercase tracking-widest">Bekliyor</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">26</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1 relative z-10">Eşleşme Bekleyen Kategori</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sol Kısım: Map Edilecek Lokal Kategoriler */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                Firmanıza Ait (ERP) Kategoriler
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] tracking-wider uppercase">26 Kayıt</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Eşleştirme bekleyen lokal ağacınız.</p>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {[
                                        { id: '1', name: 'Madeni Yağlar 5W', count: 42 },
                                        { id: '2', name: 'Yeni Kış Lastikleri', count: 18 },
                                        { id: '3', name: 'Oto Yedek > Fren Disk', count: 115 },
                                        { id: '4', name: 'Silecekler 2026', count: 34 },
                                        { id: '5', name: 'Antifriz (Kırmızı)', count: 8 },
                                    ].map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between p-3.5 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 cursor-pointer transition-all shadow-sm group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 font-medium border border-slate-100 dark:border-white/5">
                                                    🏷️
                                                </div>
                                                <div>
                                                    <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cat.name}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">{cat.count} Ürün bağlandı</div>
                                                </div>
                                            </div>
                                            <button className="h-8 px-3 rounded text-[11px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-100">
                                                Eşle &rarr;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sağ Kısım: Global Taxonomy Ağacı */}
                    <div className="bg-slate-50 dark:bg-[#1e293b]/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner overflow-hidden flex flex-col h-[600px]">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] flex items-center justify-between shadow-sm z-10">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">B2B Global Kategori Dizini</h2>
                                <p className="text-xs text-slate-500 mt-1">Platformun merkezi evrensel dil ağacı.</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-[#0f172a] rounded-lg p-1 border border-slate-200 dark:border-white/5">
                                <input type="text" placeholder="Global Kategorilerde Ara..." className="bg-transparent text-[12px] font-medium px-3 outline-none text-slate-700 dark:text-slate-300 min-w-[200px]" />
                                <div className="px-2 text-slate-400 font-bold border-l border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px]">CTRL+F</div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="max-w-[400px] mx-auto text-center mt-12 opacity-80">
                                <div className="w-20 h-20 bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
                                    <ArrowRightLeft className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Eşleştirme Motoru Bekliyor</h3>
                                <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                                    Soldaki panelden haritalamak istediğiniz bir lokal ERP kategorisini seçin. Ardından bu alanda belirecek evrensel ağaç üzerinden Hedef Global Kategoriyi işaretleyin.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
