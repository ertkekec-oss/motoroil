"use client";

import React, { useState, useEffect } from "react";

export default function ProvidersPage() {
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        const res = await fetch("/api/admin/payments-escrow/providers/status");
        if (res.ok) {
            setProviders((await res.json()).providers);
        }
        setLoading(false);
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
                alert(`${providerName} Mutabakat Sağlama süreci kuyruğa alındı.`);
            } else {
                alert("İşlem reddedildi.");
            }
        } catch (error) {
            alert("Sistem hatası");
        }
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="border-b pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ödeme Sağlayıcı Altyapısı (Providers)</h1>
                <p className="text-sm text-slate-500 mt-2">Iyzico, Ödeal, PayTR gibi ödeme ağ geçidi entegrasyon sağlık durumu ve mutabakat (reconciliation) zorlaması.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providers.map(p => (
                    <div key={p.name} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                {p.name}
                            </h2>
                            <span className={`px-2 py-1 text-xs font-bold rounded ${p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                        </div>

                        <div className="space-y-3 text-sm text-slate-600 mb-6">
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-slate-500">Alt Üye İşyeri Özelliği:</span> <span className={p.onboardingEnabled ? 'text-blue-600 font-medium' : 'text-slate-400'}>{p.onboardingEnabled ? 'Açık' : 'Kapalı'}</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-slate-500">Gecikme (Reconcile Lag):</span> <span className={p.reconcileLagMins > 0 ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>{p.reconcileLagMins} Dakika</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="font-semibold text-slate-500">Hata/Başarı Oranı (Rate):</span> <span>%{p.errorRatePercent}</span></div>
                            <div className="flex justify-between"><span className="font-semibold text-slate-500">Son Webhook:</span> <span>{p.lastWebhookReceived ? new Date(p.lastWebhookReceived).toLocaleString() : 'Veri Yok'}</span></div>
                        </div>

                        <button onClick={() => triggerReconcile(p.name)} disabled={p.status !== 'ACTIVE'} className="w-full py-2 bg-slate-900 text-white rounded font-medium disabled:opacity-50 hover:bg-black transition-colors">
                            Manuel Mutabakat Tetikle (Reconcile Pull)
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
