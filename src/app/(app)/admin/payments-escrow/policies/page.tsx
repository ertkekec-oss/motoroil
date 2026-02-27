"use client";

import React, { useState, useEffect } from "react";

export default function PoliciesPage() {
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
            alert("Lütfen geçerli bir değişiklik nedeni (en az 5 karakter) giriniz.");
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
                alert("Ayarlar güncellendi (Audit Log oluşturuldu).");
                setReason("");
                fetchConfig();
            } else {
                const err = await res.json();
                alert(`Hata: ${err.error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading || !config) {
        return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-b pb-4">
                    Escrow & Policy Governance
                </h1>
                <p className="text-sm text-slate-500 mt-2 hover:text-slate-700">Platform geneli emanet ödeme ve havuz kuralları.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GLOBAL DEFAULTS */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                    <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">⚙️</span>
                        Global Escrow Defaults
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Default Hold Days (Gün)</label>
                            <input
                                type="number"
                                value={config.globalEscrowDefaults.defaultHoldDays}
                                onChange={(e) => setConfig({
                                    ...config,
                                    globalEscrowDefaults: { ...config.globalEscrowDefaults, defaultHoldDays: parseInt(e.target.value) }
                                })}
                                className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring focus:ring-blue-100"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="allowEarly"
                                checked={config.globalEscrowDefaults.allowEarlyRelease}
                                onChange={(e) => setConfig({
                                    ...config,
                                    globalEscrowDefaults: { ...config.globalEscrowDefaults, allowEarlyRelease: e.target.checked }
                                })}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            />
                            <label htmlFor="allowEarly" className="text-sm font-medium text-slate-700">Erken Kesintili Çekime İzin Ver (Early Release)</label>
                        </div>

                        {config.globalEscrowDefaults.allowEarlyRelease && (
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Early Release Fee Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={config.globalEscrowDefaults.earlyReleaseFeeRate}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        globalEscrowDefaults: { ...config.globalEscrowDefaults, earlyReleaseFeeRate: parseFloat(e.target.value) }
                                    })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring focus:ring-blue-100"
                                />
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                            <input type="text" placeholder="Değişiklik nedeni (Zorunlu İç Denetim)" value={reason} onChange={e => setReason(e.target.value)} className="w-full text-sm p-2 bg-slate-50 border rounded-md" />
                            <button onClick={() => handleSave({ globalEscrowDefaults: config.globalEscrowDefaults })} disabled={saving} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Kaydediliyor...' : 'Varsayılanları Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ROLLOUT & KILL SWITCHES */}
                <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                    <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">🚨</span>
                        Kill Switches (Acil Durum)
                    </h2>

                    <div className="space-y-4">
                        {[
                            { key: 'escrowPaused', label: 'Emanet Alımı Durdur (Satışları kapatır)' },
                            { key: 'payoutPaused', label: 'Satıcı Çekimlerini Durdur (Risk Algısı)' },
                            { key: 'boostPaused', label: 'Boost Satın Alımlarını Durdur' }
                        ].map(sw => (
                            <div key={sw.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <label className="text-sm font-medium text-slate-800">{sw.label}</label>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id={sw.key} checked={config[sw.key as keyof typeof config]}
                                        onChange={(e) => setConfig({ ...config, [sw.key]: e.target.checked })}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: config[sw.key as keyof typeof config] ? 0 : '1.5rem', borderColor: config[sw.key as keyof typeof config] ? '#EF4444' : '#E2E8F0', transition: 'right 0.2s, border-color 0.2s' }} />
                                    <label htmlFor={sw.key} className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer" style={{ backgroundColor: config[sw.key as keyof typeof config] ? '#EF4444' : '#E2E8F0', transition: 'background-color 0.2s' }}></label>
                                </div>
                            </div>
                        ))}

                        <div className="mt-6 pt-4 border-t border-red-100 space-y-3">
                            <input type="text" placeholder="Devre dışı bırakma/Açma Nedeni" value={reason} onChange={e => setReason(e.target.value)} className="w-full text-sm p-2 bg-red-50 border border-red-100 rounded-md placeholder-red-300" />
                            <button onClick={() => handleSave({
                                escrowPaused: config.escrowPaused,
                                payoutPaused: config.payoutPaused,
                                boostPaused: config.boostPaused
                            })} disabled={saving} className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                                {saving ? 'Uygulanıyor...' : 'Durdurma Emrini Ver / Geri Çek'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* TRUST TIER DELTAS */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                    <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">⭐</span>
                        Güven Skoru (Trust Tier) Etkileri
                    </h2>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {['A', 'B', 'C', 'D'].map(tier => (
                            <div key={tier} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="text-lg font-black mb-1">Tier {tier}</div>
                                <label className="text-xs font-semibold text-slate-500">Hold Days Delta</label>
                                <input
                                    type="number"
                                    value={config.trustTierEffects[tier]?.holdDaysDelta || 0}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        trustTierEffects: {
                                            ...config.trustTierEffects,
                                            [tier]: { holdDaysDelta: parseInt(e.target.value) }
                                        }
                                    })}
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring focus:ring-emerald-100"
                                />
                                <div className="text-[10px] text-slate-400 mt-2">
                                    Örnek Vade: {config.globalEscrowDefaults.defaultHoldDays + (config.trustTierEffects[tier]?.holdDaysDelta || 0)} gün
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 max-w-sm ml-auto space-y-3">
                        <input type="text" placeholder="Değişiklik nedeni" value={reason} onChange={e => setReason(e.target.value)} className="w-full text-sm p-2 bg-slate-50 border rounded-md" />
                        <button onClick={() => handleSave({ trustTierEffects: config.trustTierEffects })} disabled={saving} className="w-full py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50">
                            {saving ? 'Kaydediliyor...' : 'Tier Modellerini Güncelle'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
