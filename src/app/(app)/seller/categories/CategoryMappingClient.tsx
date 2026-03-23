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
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{mappingStats.total}</h3>
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
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">{mappingStats.mapped}</h3>
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
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">{mappingStats.pending}</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1 relative z-10">Eşleşme Bekleyen Kategori</p>
                    </div>
                </div>

                <div className="mb-8 relative overflow-hidden group bg-slate-900 border border-indigo-500/30 rounded-[1.5rem] p-6 shadow-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 hover:border-indigo-400/50 transition-all">
                    <div className="absolute top-1/2 left-16 -translate-y-1/2 w-[250px] h-[250px] rounded-full border border-indigo-500/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
                    
                    <div className="flex items-center gap-6 relative z-10 w-full xl:w-auto">
                        <div className="relative shrink-0 flex items-center justify-center w-[72px] h-[72px] rounded-full bg-slate-950 border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/60 border-dashed animate-[spin_8s_linear_infinite] opacity-50"></div>
                            <Sparkles className="w-8 h-8 text-indigo-300 relative z-10" />
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3 mb-1">
                                Otonom AI Kurtarma Sürücüsü
                                <span className="px-2 py-[2px] rounded text-[9px] bg-teal-500/20 text-teal-300 font-bold uppercase tracking-[0.2em] border border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.3)]">AI Aktif</span>
                            </h3>
                            <p className="text-indigo-100/70 text-[13px] max-w-2xl font-medium leading-relaxed mt-1">
                                Etiketsiz ("Diğer" veya boş) ürünlerinizi tarar ve Hub'a çıkmaları için köprüler. <br className="hidden md:block"/> Özel deponuza (ERP'nize) dokunup dokunmamasını siz seçebilirsiniz.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full xl:w-auto mt-4 xl:mt-0">
                        <button disabled={isPending} onClick={() => {
                            startTransition(async () => {
                                const { runAiMappingAction } = await import("@/actions/runAiMappingAction");
                                const res = await runAiMappingAction(false);
                                if (res.success) {
                                    showSuccess("Gümrük Çözüldü!", `${res.count} adet etiketlenmemiş ürün, özel deponuz bozulmadan başarıyla Hub'a bağlandı.`);
                                } else {
                                    showError("Hata", res.error);
                                }
                            });
                        }} className="h-[52px] px-6 bg-slate-800 hover:bg-slate-700 text-white font-black text-[11px] rounded-xl uppercase tracking-widest border border-slate-700 hover:border-slate-500 transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap group disabled:opacity-50">
                            🔒 Lokalime Dokunma, <br/>Sadece Hub'a Bağla
                        </button>

                        <button disabled={isPending} onClick={() => {
                            startTransition(async () => {
                                const { runAiMappingAction } = await import("@/actions/runAiMappingAction");
                                const res = await runAiMappingAction(true);
                                if (res.success) {
                                    showSuccess("Düzen Sağlandı!", `${res.count} ürün tespit edildi. Hem Hub'a bağlandı hem de kendi klasör isimleriniz tek tip modernize edildi.`);
                                } else {
                                    showError("Hata", res.error);
                                }
                            });
                        }} className="h-[52px] px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] rounded-xl uppercase tracking-widest shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50">
                            ✨ Lokalimi de Düzelt <br/>ve Hub'a Bağla
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
                    <div className="bg-slate-50 dark:bg-[#1e293b]/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner overflow-hidden flex flex-col h-[600px]">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] flex items-center justify-between shadow-sm z-10">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">B2B Global Kategori Dizini</h2>
                                <p className="text-xs text-slate-500 mt-1">Platformun merkezi evrensel dil ağacı.</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-[#0f172a] rounded-lg p-1 border border-slate-200 dark:border-white/5">
                                <input 
                                    type="text" 
                                    placeholder="Global Kategorilerde Ara..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent text-[12px] font-medium px-3 outline-none text-slate-700 dark:text-slate-300 min-w-[200px]" 
                                />
                                <div className="px-2 text-slate-400 font-bold border-l border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px]">CTRL+F</div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            {globalCategories.length === 0 ? (
                                <div className="max-w-[400px] mx-auto text-center mt-12 opacity-80">
                                    <div className="w-20 h-20 bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
                                        <Database className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Global Kategori Bulunamadı</h3>
                                    <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                                        Platform yöneticileri henüz merkezi kategori ağacını tanımlamamış.
                                    </p>
                                </div>
                            ) : filteredGlobal.length === 0 ? (
                                <div className="text-center mt-20 opacity-60">Sonuç bulunamadı.</div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredGlobal.map((gc: any) => (
                                        <div key={gc.id} className={`p-4 rounded-xl border shadow-sm transition-all flex items-center justify-between ${
                                            selectedLocal ? 'bg-white dark:bg-[#0f172a] border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md' : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 opacity-50 grayscale'
                                        }`}>
                                            <div>
                                                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{gc.name}</div>
                                                <div className="text-[11px] text-slate-500 mt-1">Slug: {gc.slug}</div>
                                            </div>
                                            {selectedLocal && (
                                                <button 
                                                    disabled={isPending}
                                                    onClick={() => handleMap(gc.id, gc.name)}
                                                    className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 shadow-sm transition-all disabled:opacity-50"
                                                >
                                                    {isPending ? 'Bağlanıyor...' : 'Otoyola Bağla'}
                                                    {!isPending && <Sparkles className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                     {/* Instruction Ghost Box */}
                                     {searchQuery === "" && (
                                     <div className="max-w-[400px] mx-auto text-center mt-12 opacity-80">
                                        <div className="w-20 h-20 bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
                                            <ArrowRightLeft className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Eşleştirme Motoru Bekliyor</h3>
                                        <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                                            Soldaki panelden haritalamak istediğiniz bir lokal ERP kategorisini seçin. Ardından bu alanda belirecek evrensel ağaç üzerinden Hedef Global Kategoriyi işaretleyin.
                                        </p>
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
