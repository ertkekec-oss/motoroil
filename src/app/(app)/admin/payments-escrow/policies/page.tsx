"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { FileText, Settings, AlertTriangle, ShieldCheck, Save, Clock, Percent } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export default function PoliciesPage() {
    const { showSuccess, showError, showWarning } = useModal();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/payments-escrow/policies");
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (payload: any) => {
        if (!reason || reason.trim().length < 5) {
            showError("Uyarı", "Lütfen geçerli bir değişiklik nedeni (en az 5 karakter) giriniz.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/payments-escrow/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, reason }),
            });

            if (res.ok) {
                showSuccess("Bilgi", "Ayarlar güncellendi (Sistem Audit Log kaydı oluşturuldu).");
                setReason("");
                fetchConfig();
            } else {
                const err = await res.json();
                showError("Uyarı", `Hata: ${err.error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading || !config) {
        return (
            <div className="flex items-center justify-center h-64 w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <FileText className="w-6 h-6 text-indigo-500" />
                            Escrow & Policy Governance
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Platform geneli emanet ödeme bekletme (Hold) süreleri, çekim kuralları ve acil durum protokolleri (Kill Switch).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GLOBAL DEFAULTS */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                            <Settings className="w-5 h-5 text-indigo-500" />
                            Global Escrow Ayarları
                        </h2>

                        <div className="space-y-6 flex-1 relative z-10">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                    <Clock className="w-3.5 h-3.5" /> Normal Bekletme Süresi (Gün)
                                </label>
                                <input
                                    type="number"
                                    value={config.globalEscrowDefaults.defaultHoldDays}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        globalEscrowDefaults: { ...config.globalEscrowDefaults, defaultHoldDays: parseInt(e.target.value) }
                                    })}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                />
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={config.globalEscrowDefaults.allowEarlyRelease}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                globalEscrowDefaults: { ...config.globalEscrowDefaults, allowEarlyRelease: e.target.checked }
                                            })}
                                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 transition-colors cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Erken Kesintili Çekime İzin Ver (Early Release)</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Satıcılar, vade gününü beklemeden ek bir komisyon ödeyerek hakedişlerini hemen çekebilir.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {config.globalEscrowDefaults.allowEarlyRelease && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/30 animate-in slide-in-from-top-2">
                                    <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                        <Percent className="w-3.5 h-3.5" /> Erken Çekim Komisyonu (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={config.globalEscrowDefaults.earlyReleaseFeeRate}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            globalEscrowDefaults: { ...config.globalEscrowDefaults, earlyReleaseFeeRate: parseFloat(e.target.value) }
                                        })}
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/50 rounded-lg text-sm font-black text-indigo-700 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-3 mt-auto">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mali Denetim Kaydı</label>
                                <input type="text" placeholder="Değişiklik sebebi girin..." value={reason} onChange={e => setReason(e.target.value)} className="w-full text-sm p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-900 dark:text-white" />
                                <button onClick={() => handleSave({ globalEscrowDefaults: config.globalEscrowDefaults })} disabled={saving} className="w-full py-3 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-black dark:hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                                    <Save className="w-4 h-4" /> {saving ? 'Sisteme İşleniyor...' : 'Varsayılanları Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ROLLOUT & KILL SWITCHES */}
                    <div className="bg-gradient-to-br from-rose-50 to-white dark:from-[#3f1625] dark:to-[#1e293b] p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm relative flex flex-col h-full overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                        <h2 className="font-bold text-lg text-rose-900 dark:text-rose-400 mb-6 flex items-center gap-2 relative z-10">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            Acil Durum Yönetimi (Kill Switches)
                        </h2>

                        <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mb-6 relative z-10">
                            Aşağıdaki anahtarlar platformdaki temel fonksiyonları anında durdurur. Yalnızca kriz/istismar anlarında kullanın.
                        </p>

                        <div className="space-y-4 flex-1 relative z-10">
                            {[
                                { key: 'escrowPaused', label: 'Emanet Alımı Durdur', desc: 'Yeni sipariş ve sepet onayını kapatır' },
                                { key: 'payoutPaused', label: 'Satıcı Çekimlerini Durdur', desc: 'Tüm ödeme çıkışlarını dondurur' },
                                { key: 'boostPaused', label: 'Boost Satışını Durdur', desc: 'Sponsorlu ürün satışını engeller' }
                            ]?.map(sw => (
                                <div key={sw.key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-rose-100 dark:border-rose-900/30 gap-4 sm:gap-2">
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{sw.label}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sw.desc}</div>
                                    </div>
                                    
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={config[sw.key as keyof typeof config]} onChange={(e) => setConfig({ ...config, [sw.key]: e.target.checked })} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-500"></div>
                                    </label>
                                </div>
                            ))}

                            <div className="pt-6 border-t border-rose-200 dark:border-rose-900/30 space-y-3 mt-auto">
                                <label className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Acil Durum Protokolü Kaydı</label>
                                <input type="text" placeholder="Devre dışı bırakma veya açma nedeni..." value={reason} onChange={e => setReason(e.target.value)} className="w-full text-sm p-3 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800/80 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                                <button onClick={() => handleSave({
                                    escrowPaused: config.escrowPaused,
                                    payoutPaused: config.payoutPaused,
                                    boostPaused: config.boostPaused
                                })} disabled={saving} className="w-full py-3 flex items-center justify-center gap-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                                    <AlertTriangle className="w-4 h-4" /> {saving ? 'Protokol Başlatılıyor...' : 'Uygula / Geri Çek'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TRUST TIER DELTAS */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm md:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Güven Skoru (Trust Tier) Etkileri
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                            {['A', 'B', 'C', 'D']?.map(tier => (
                                <div key={tier} className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl group hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
                                    <div className={`text-xl font-black mb-3 ${
                                        tier === 'A' ? 'text-emerald-500' :
                                        tier === 'B' ? 'text-blue-500' :
                                        tier === 'C' ? 'text-amber-500' :
                                        'text-rose-500'
                                    }`}>Sınıf {tier}</div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Hold Days Delta</label>
                                        <input
                                            type="number"
                                            value={config.trustTierEffects[tier]?.holdDaysDelta || 0}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                trustTierEffects: { ...config.trustTierEffects, [tier]: { holdDaysDelta: parseInt(e.target.value) } }
                                            })}
                                            className="w-full text-sm font-bold bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                        />
                                        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2 bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                                            Örnek Vade: <span className="text-emerald-600 dark:text-emerald-400 font-mono">{config.globalEscrowDefaults.defaultHoldDays + (config.trustTierEffects[tier]?.holdDaysDelta || 0)}</span> gün
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative z-10">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Trust Tier (Sınıf) kuralları, satıcının performansına göre kazançların daha hızlı veya geç aktarılmasını sağlar.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 ml-auto w-full md:w-auto">
                                <input type="text" placeholder="Değişiklik nedeni" value={reason} onChange={e => setReason(e.target.value)} className="flex-1 text-sm p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" />
                                <button onClick={() => handleSave({ trustTierEffects: config.trustTierEffects })} disabled={saving} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-black dark:hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-sm whitespace-nowrap">
                                    {saving ? 'Kaydediliyor...' : 'Tier Modellerini Uygula'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
