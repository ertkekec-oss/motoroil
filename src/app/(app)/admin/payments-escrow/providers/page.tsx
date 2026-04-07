"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { ShieldCheck, Activity, RefreshCw, ServerCrash, CreditCard } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export default function ProvidersPage() {
    const { showSuccess, showError, showWarning } = useModal();
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/payments-escrow/providers/status");
            if (res.ok) {
                const data = await res.json();
                setProviders(data.providers || []);
            } else {
                showError("Hata", "Sağlayıcı durumları alınamadı.");
            }
        } catch (e) {
            showError("Sunucu Hatası", "Ödeme altyapısı ile bağlantı kurulamadı.");
        } finally {
            setLoading(false);
        }
    };

    const triggerReconcile = async (providerName: string) => {
        const idempotencyKey = crypto.randomUUID();
        try {
            const res = await fetch("/api/admin/payments-escrow/providers/reconcile-pull", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-idempotency-key": idempotencyKey
                },
                body: JSON.stringify({ provider: providerName })
            });

            if (res.ok) {
                showSuccess("Başarılı", `${providerName} Mutabakat Sağlama süreci kuyruğa alındı.`);
            } else {
                showWarning("Reddedildi", "İşlem reddedildi veya yetkiniz yok.");
            }
        } catch (error) {
            showError("Uyarı", "Sistem hatası oluştu.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <EnterprisePageShell
        title="Yönetim Paneli"
        description="Sistem detaylarını yapılandırın."
    >
        <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <CreditCard className="w-6 h-6 text-indigo-500" />
                            Ödeme Sağlayıcı Altyapısı (Gateway Health)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Iyzico, Ödeal, PayTR gibi ödeme ağ geçidi (PSP) entegrasyonlarının sağlık durumu ve manuel mutabakat (reconciliation) zorlaması.
                        </p>
                    </div>
                    <button onClick={fetchProviders} className="px-5 py-2.5 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/50 outline-none">
                        <RefreshCw className="w-4 h-4" /> Durumu Yenile
                    </button>
                </div>

                {providers.length === 0 ? (
                    <div className="p-16 text-center bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <ServerCrash className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Altyapı Bulunamadı</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                            Sistemde yapılandırılmış aktif veya pasif bir ödeme sağlayıcı (Gateway) modülü bulunmuyor. Geliştirici ekibiyle iletişime geçin.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {providers.map(p => {
                            const isActive = p.status === 'ACTIVE';
                            const lagCritical = p.reconcileLagMins > 120;
                            const lagWarning = p.reconcileLagMins > 30;

                            return (
                                <div key={p.name} className="relative bg-white dark:bg-[#1e293b] p-6 lg:p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
                                    {/* Background Glow */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full translate-x-10 -translate-y-10 opacity-30 transition-all duration-700 ${isActive ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-slate-400 blur-3xl'}`}></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-white/5 pb-5">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                                                <span className="relative flex h-3.5 w-3.5">
                                                    {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                </span>
                                                {p.name}
                                            </h2>
                                            <span className={`px-3 py-1.5 text-[10px] font-black rounded-lg tracking-widest uppercase shadow-sm ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                                {isActive ? 'AKTİF (CANLI)' : p.status}
                                            </span>
                                        </div>

                                        <div className="space-y-4 text-sm mb-8">
                                            <div className="flex justify-between items-center py-2.5 border-b border-slate-50 dark:border-white/5 group/item">
                                                <span className="font-semibold text-slate-500 dark:text-slate-400 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-300 transition-colors">Alt Üye İşyeri Özelliği (SubMerchant)</span> 
                                                <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider border ${p.onboardingEnabled ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-400' : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'}`}>
                                                    {p.onboardingEnabled ? 'Açık / Devrede' : 'Kapalı'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2.5 border-b border-slate-50 dark:border-white/5 group/item">
                                                <span className="font-semibold text-slate-500 dark:text-slate-400 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-300 transition-colors">
                                                    Senkronizasyon Gecikmesi
                                                </span> 
                                                <span className={`font-mono font-bold text-[13px] bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm ${lagCritical ? 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900' : lagWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {p.reconcileLagMins} Dakika
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2.5 border-b border-slate-50 dark:border-white/5 group/item">
                                                <span className="font-semibold text-slate-500 dark:text-slate-400 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-300 transition-colors">Hata Oranı (Timeout/Reddedilen)</span> 
                                                <span className={`font-mono font-bold text-[13px] ${p.errorRatePercent > 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>%{p.errorRatePercent}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2.5 group/item">
                                                <span className="font-semibold text-slate-500 dark:text-slate-400 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-300 transition-colors">Son Webhook Sinyali</span> 
                                                <span className="text-slate-700 dark:text-slate-300 font-medium text-[13px]">
                                                    {p.lastWebhookReceived ? new Date(p.lastWebhookReceived).toLocaleString('tr-TR') : 'Sinyal Yok'}
                                                </span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => triggerReconcile(p.name)} 
                                            disabled={!isActive} 
                                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:bg-slate-700 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm focus:ring-4 focus:ring-indigo-500/20 outline-none cursor-pointer">
                                            <Activity className="w-5 h-5" />
                                            Mutabakat Tetikle (Reconcile Pull)
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </EnterprisePageShell>
    );
}
