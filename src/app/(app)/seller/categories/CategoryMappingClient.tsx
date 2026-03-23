"use client";

import { useState, useTransition } from "react";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";
import { Network, ArrowRightLeft, Database, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { mapCategoryAction } from "@/actions/mapCategoryAction";
import { useModal } from "@/contexts/ModalContext";

export default function CategoryMappingClient({ 
    localCategories, 
    globalCategories,
    mappingStats 
}: { 
    localCategories: any[], 
    globalCategories: any[],
    mappingStats: { total: number, mapped: number, pending: number }
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLocal, setSelectedLocal] = useState<any>(null);
    const { showSuccess, showError } = useModal();
    const [isPending, startTransition] = useTransition();

    const filteredGlobal = globalCategories.filter((g: any) => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMap = (globalId: string, globalName: string) => {
        if (!selectedLocal) return;

        startTransition(async () => {
            const res = await mapCategoryAction(selectedLocal.name, globalId);
            if (res.success) {
                showSuccess("Ağ Entegrasyonu Tamamlandı", `Tüm "${selectedLocal.name}" envanteri başarıyla "${globalName}" global dizinine bağlandı ve yayın havuzuna aktarıldı!`);
                setSelectedLocal(null);
            } else {
                showError("Entegrasyon Hatası", res.error);
            }
        });
    };

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubCatalogTabs />

                <div className="mb-6">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Ağ Kategori Haritalama (Mapping Engine)
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-4xl">
                        Kendi ERP sisteminizdeki lokal kategorilerinizi, Periodya B2B Global Kategori ağacına eşleştirerek envanterinizi hub'a entegre edin.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-[#1e293b] px-5 py-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                            <Database className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lokal (ERP) Kategoriler</div>
                            <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{mappingStats.total} <span className="text-xs font-semibold text-slate-500 ml-1">Kayıt</span></div>
                        </div>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 px-5 py-4 rounded-xl border border-emerald-100 dark:border-emerald-500/10 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-0.5">Global'e Eşleşen</div>
                            <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">{mappingStats.mapped} <span className="text-xs font-semibold text-emerald-600/70 ml-1">Kayıt</span></div>
                        </div>
                    </div>

                    <div className="bg-rose-50/50 dark:bg-rose-500/5 px-5 py-4 rounded-xl border border-rose-100 dark:border-rose-500/10 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-widest mb-0.5">Eşleşme Bekleyen</div>
                            <div className="text-lg font-black text-rose-700 dark:text-rose-400 leading-none">{mappingStats.pending} <span className="text-xs font-semibold text-rose-600/70 ml-1">Kayıt</span></div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 bg-slate-900 dark:bg-slate-950 border border-indigo-500/30 rounded-xl px-4 py-3 shadow-md flex items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Compact Periodya AI Icon */}
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse"></div>
                            <div className="relative z-10 font-bold text-lg font-serif italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-400">P</div>
                        </div>
                        
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white whitespace-nowrap">Otonom AI Kurtarma Sürücüsü</span>
                                <span className="px-1.5 py-[2px] rounded text-[8px] bg-teal-500/20 text-teal-300 font-bold uppercase tracking-wider border border-teal-500/30 shadow-sm flex items-center gap-1 shrink-0">
                                    <span className="w-1 h-1 rounded-full bg-teal-400 animate-pulse"></span>
                                    AI Aktif
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="hidden lg:block flex-1 text-indigo-100/70 text-[12px] font-medium leading-tight truncate px-4 border-l border-white/10">
                        Etiketsiz ürünlerinizi tarar ve Hub'a çıkmaları için köprüler. Lokal envanterinize dokunulmaz.
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button disabled={isPending} onClick={() => {
                            startTransition(async () => {
                                const { runAiMappingAction } = await import("@/actions/runAiMappingAction");
                                const res = await runAiMappingAction(false);
                                if (res.success) {
                                    showSuccess("Gümrük Çözüldü!", `${res.count} adet etiketlenmemiş ürün başarıyla Hub'a bağlandı.`);
                                } else {
                                    showError("Hata", res.error);
                                }
                            });
                        }} className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider border border-slate-700 transition-colors shadow flex items-center justify-center whitespace-nowrap disabled:opacity-50">
                            🔒 Sadece Hub'a Bağla
                        </button>

                        <button disabled={isPending} onClick={() => {
                            startTransition(async () => {
                                const { runAiMappingAction } = await import("@/actions/runAiMappingAction");
                                const res = await runAiMappingAction(true);
                                if (res.success) {
                                    showSuccess("Düzen Sağlandı!", `${res.count} ürün tespit edildi. Lokaliniz modernize edilerek ağa eklendi.`);
                                } else {
                                    showError("Hata", res.error);
                                }
                            });
                        }} className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center whitespace-nowrap disabled:opacity-50">
                            ✨ Lokalimi Düzelt & Bağla
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sol Kısım: Map Edilecek Lokal Kategoriler */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                Firmanıza Ait (ERP) Kategoriler
                                <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-bold ${mappingStats.pending > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {localCategories.length} Kayıt
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Eşleştirme bekleyen lokal ağacınız.</p>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            {localCategories.length === 0 ? (
                                <div className="text-center py-20 opacity-60">
                                    <div className="text-4xl mb-3">📁</div>
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lokal Kategori Bulunamadı</h3>
                                    <p className="text-xs text-slate-500 w-2/3 mx-auto mt-2">Sisteme yüklediğiniz ürünlerde atanmış herhangi bir kategori tespit edilemedi.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localCategories.map((cat: any) => {
                                        const isSelected = selectedLocal?.name === cat.name;
                                        return (
                                        <div 
                                            key={cat.id || cat.name} 
                                            onClick={() => !cat.globalCategory && setSelectedLocal(isSelected ? null : cat)}
                                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all shadow-sm group ${
                                                cat.globalCategory 
                                                    ? 'bg-slate-50/50 dark:bg-white/[0.01] border-slate-100 dark:border-white/5 opacity-80 cursor-default'
                                                    : isSelected 
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/20 cursor-pointer scale-[1.01]' 
                                                        : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium border ${
                                                    isSelected ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-indigo-500 border-slate-100 dark:border-white/5'
                                                }`}>
                                                    🏷️
                                                </div>
                                                <div>
                                                    <div className={`text-[13px] font-bold transition-colors ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>{cat.name}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">{cat._count?.id || cat.count || 0} Ürün bağlandı</div>
                                                </div>
                                            </div>
                                            {cat.globalCategory ? (
                                                <button disabled className="h-8 px-3 rounded text-[11px] font-bold tracking-widest uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100 dark:border-emerald-500/20 cursor-default">
                                                    Eşleşti 
                                                </button>
                                            ) : (
                                                <button className={`h-8 px-3 rounded text-[11px] font-bold tracking-widest uppercase transition-colors border ${
                                                    isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white'
                                                }`}>
                                                    {isSelected ? 'Seçildi' : 'Eşle \u2192'}
                                                </button>
                                            )}
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sağ Kısım: Global Taxonomy Ağacı */}
                    <div className="bg-slate-50 dark:bg-[#1e293b]/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner overflow-hidden flex flex-col h-[600px] select-none">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] flex items-center justify-between shadow-sm z-10">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">B2B Global Kategori Dizini</h2>
                                <p className="text-xs text-slate-500 mt-1">Ağaç yalnızca eşleştirme yaparken açılır.</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-[#0f172a] rounded-lg p-1 border border-slate-200 dark:border-white/5">
                                <input 
                                    type="text" 
                                    placeholder="Kategorilerde Ara (Zorunlu)" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={!selectedLocal}
                                    className="bg-transparent text-[12px] font-medium px-3 outline-none text-slate-700 dark:text-slate-300 min-w-[200px] disabled:opacity-50" 
                                />
                                <div className="px-2 text-slate-400 font-bold border-l border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px]">CTRL+F</div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {!selectedLocal ? (
                                <div className="max-w-[400px] mx-auto text-center mt-12 opacity-80">
                                    <div className="w-20 h-20 bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
                                        <Database className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Global Dizin Kilitli 🔒</h3>
                                    <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                                        Güvenlik önlemleri gereği Global Kategori ağacı şeffaf listelenmez. Lütfen ağacı görüntülemek ve arama yapmak için sol taraftan <b>"Eşle"</b> butonuna basarak bir Lokal kategori seçin.
                                    </p>
                                </div>
                            ) : filteredGlobal.length === 0 ? (
                                <div className="text-center mt-20 opacity-60 text-sm font-medium">Aramanıza uygun global sonuç bulunamadı.</div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredGlobal.slice(0, 75).map((gc: any) => (
                                        <div key={gc.id} className="p-4 rounded-xl border shadow-sm transition-all flex items-center justify-between bg-white dark:bg-[#0f172a] border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md pointer-events-none">
                                            <div className="pointer-events-auto px-2">
                                                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 select-none pointer-events-none">{gc.name}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest select-none pointer-events-none">ID: {gc.id.split('-')[0]}-PROTECTED</div>
                                            </div>
                                            {selectedLocal && (
                                                <button 
                                                    disabled={isPending}
                                                    onClick={() => handleMap(gc.id, gc.name)}
                                                    className="pointer-events-auto shrink-0 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:opacity-90 active:scale-95 shadow-sm transition-all disabled:opacity-50"
                                                >
                                                    {isPending ? 'Bağlanıyor...' : 'EŞLEŞTİR \u2192'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {filteredGlobal.length > 75 && (
                                        <div className="text-center p-4 text-[11px] font-bold tracking-widest uppercase text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                                            +{filteredGlobal.length - 75} Diğer Sonuç (Aramayı Daraltın)
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
