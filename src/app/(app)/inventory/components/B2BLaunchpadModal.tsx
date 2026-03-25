import React, { useState, useEffect } from "react";
import { Rocket, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";

export function B2BLaunchpadModal({ isOpen, onClose, productIds, products, onConfirm }: any) {
    const [phase, setPhase] = useState<"scanning" | "ready" | "launching" | "done">("scanning");
    const [progress, setProgress] = useState(0);

    const activeProducts = products.filter((p: any) => productIds.includes(p.id));
    const targetProduct = activeProducts[0]; // Assuming single for deep analysis, or multiple as batch
    const count = activeProducts.length;

    // "Sessiz Polis" (Guardrail) Logic
    const validationErrors: string[] = [];
    if (activeProducts.some((p: any) => !p.buyPrice || p.buyPrice <= 0)) validationErrors.push("Sıfır Maliyetli Ürün Tespit Edildi");
    if (activeProducts.some((p: any) => p.stock <= 0)) validationErrors.push("Stokta Olmayan Ürün Tespit Edildi");
    if (activeProducts.some((p: any) => !p.name || p.name.length < 5)) validationErrors.push("Yetersiz Ürün Başlığı");

    useEffect(() => {
        if (!isOpen) { setPhase("scanning"); setProgress(0); return; }
        
        // Simüle edilmiş AI analiz süreci
        let t = 0;
        const interval = setInterval(() => {
            t += 15;
            setProgress(Math.min(t, 100));
            if (t >= 100) {
                clearInterval(interval);
                setPhase("ready");
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isOpen]);

    const handleLaunch = () => {
        if (validationErrors.length > 0) return; // Prevent launch if errors
        
        setPhase("launching");
        setTimeout(() => {
            setPhase("done");
            setTimeout(() => {
                onConfirm(productIds);
            }, 1500);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
            {/* Deep Glass Backdrop (Obsidian) */}
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xl transition-opacity animate-in fade-in duration-500"></div>

            <div className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(79,70,229,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-500 overflow-hidden group">
                {/* Background glow effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/20 dark:bg-indigo-400/20 rounded-full blur-[50px] pointer-events-none"></div>

                {phase === "scanning" && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5 line-dashed animate-spin-slow"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                            <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ağ Uygunluğu Asistanı</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2">Periodya RAG ürünleri tarıyor...</p>
                        </div>
                        <div className="w-48 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-100 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {phase === "ready" && (
                    <div className="w-full flex justify-center flex-col animate-in slide-in-from-bottom-4 duration-500 fade-in delay-150 relative z-10">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 mx-auto rounded-3xl flex items-center justify-center border border-emerald-200/50 dark:border-emerald-500/20 mb-6 shadow-sm">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                            {count > 1 ? `${count} Ürün Yayına Hazır` : targetProduct?.name}
                        </h2>
                        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mb-8 max-w-[80%] mx-auto">
                            Periodya B2B ağ gereklilikleri tarandı. Hub algoritmaları bu ürünler için yeterince rekabetçi bir pozisyon öngörüyor.
                        </p>

                        {/* Guardrails Check */}
                        {validationErrors.length > 0 ? (
                            <div className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-5 mb-8 text-left">
                                <h4 className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4"/> SESSİZ POLİS ENGELİ
                                </h4>
                                <ul className="space-y-2">
                                    {validationErrors.map((err, i) => (
                                        <li key={i} className="text-[13px] font-bold text-slate-900 dark:text-white flex items-start gap-2">
                                            <span className="text-rose-500 mt-0.5">•</span> {err}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={onClose} className="mt-4 w-full py-3 bg-white dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors border border-rose-100 dark:border-rose-500/20">
                                    Geri Dön ve Düzelt
                                </button>
                            </div>
                        ) : (
                            <div className="w-full bg-slate-50/50 dark:bg-[#0f172a]/50 border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 mb-8 text-left grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hedef Hub</span>
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">Global Marketplace</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Güvenlik Onayı</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Geçti (Guardrails OK)</span>
                                </div>
                            </div>
                        )}

                        {validationErrors.length === 0 && (
                            <button 
                                onClick={handleLaunch} 
                                className="w-full h-16 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden relative"
                            >
                                <Rocket className="w-5 h-5"/> ATEŞLE VE YAYINLA
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>
                        )}
                        <button onClick={onClose} className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white uppercase tracking-widest transition-colors">
                            İptal
                        </button>
                    </div>
                )}

                {phase === "launching" && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Rocket className="w-16 h-16 text-indigo-500 animate-bounce" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Hub'a Aktarılıyor...</h3>
                    </div>
                )}

                {phase === "done" && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Yayın Başarılı!</h3>
                        <p className="text-sm font-semibold text-slate-500">Ürünler B2B pazarına eklendi.</p>
                    </div>
                )}

            </div>
        </div>
    );
}

