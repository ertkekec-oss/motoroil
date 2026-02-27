"use client";

import React, { useState, useEffect } from "react";

export default function CommissionsPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/payments-escrow/commissions/plans");
            if (res.ok) setPlans(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const fetchPlanDetails = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/payments-escrow/commissions/plans/${id}`);
            if (res.ok) setSelectedPlan(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (isNew: boolean) => {
        if (!reason || reason.trim().length < 5) {
            alert("Sebep girmek zorunludur.");
            return;
        }

        setSaving(true);
        try {
            const url = isNew
                ? "/api/admin/payments-escrow/commissions/plans"
                : `/api/admin/payments-escrow/commissions/plans/${selectedPlan.id}`;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...selectedPlan, reason }),
            });

            if (res.ok) {
                alert("Komisyon planı kaydedildi.");
                setReason("");
                setSelectedPlan(null);
                fetchPlans();
            } else {
                alert(`Hata: ${(await res.json()).error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (id: string) => {
        const confirmReason = prompt("Planı arşivlemek için bir sebep girin:");
        if (!confirmReason || confirmReason.trim().length < 5) return;

        try {
            const res = await fetch(`/api/admin/payments-escrow/commissions/plans/${id}/archive`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: confirmReason }),
            });

            if (res.ok) fetchPlans();
        } catch (e) {
            alert("Bağlantı hatası");
        }
    };

    if (loading && !plans.length) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Komisyon Politikaları</h1>
                    <p className="text-sm text-slate-500 mt-2">Platform geneli ve satıcıya özel komisyon kesinti kuralları.</p>
                </div>
                <button onClick={() => setSelectedPlan({ name: '', isDefault: false, scope: 'GLOBAL', currency: 'TRY', rules: [] })} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    + Yeni Plan Ekle
                </button>
            </div>

            {selectedPlan ? (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h2 className="text-lg font-bold mb-4">{selectedPlan.id ? 'Planı Düzenle' : 'Yeni Plan'}</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Plan Adı</label>
                            <input type="text" value={selectedPlan.name} onChange={e => setSelectedPlan({ ...selectedPlan, name: e.target.value })} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Kapsam (Scope)</label>
                            <select value={selectedPlan.scope} onChange={e => setSelectedPlan({ ...selectedPlan, scope: e.target.value })} className="w-full p-2 border rounded">
                                <option value="GLOBAL">Platform Geneli (GLOBAL)</option>
                                <option value="COMPANY_OVERRIDE">Firma Özel Geçersiz Kılma (COMPANY_OVERRIDE)</option>
                            </select>
                        </div>
                        {selectedPlan.scope === 'COMPANY_OVERRIDE' && (
                            <div>
                                <label className="text-sm font-medium mb-1 block">Firma ID (Tenant ID)</label>
                                <input type="text" value={selectedPlan.companyId || ''} onChange={e => setSelectedPlan({ ...selectedPlan, companyId: e.target.value })} className="w-full p-2 border rounded" placeholder="örn: clr..." />
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-6">
                            <input type="checkbox" id="def" checked={selectedPlan.isDefault} onChange={e => setSelectedPlan({ ...selectedPlan, isDefault: e.target.checked })} className="w-4 h-4 cursor-pointer" />
                            <label htmlFor="def" className="text-sm font-semibold cursor-pointer">Varsayılan Yap (Diğerlerini deaktif eder)</label>
                        </div>
                    </div>

                    <h3 className="font-semibold text-slate-700 mb-2 border-b pb-2">Kurallar (Rules)</h3>
                    {selectedPlan.rules?.map((r: any, idx: number) => (
                        <div key={idx} className="flex gap-2 mb-2 p-2 border rounded items-center bg-slate-50">
                            <select value={r.matchType} onChange={e => {
                                const newRules = [...selectedPlan.rules];
                                newRules[idx].matchType = e.target.value;
                                setSelectedPlan({ ...selectedPlan, rules: newRules });
                            }} className="text-sm border p-1 rounded">
                                <option value="DEFAULT">DEFAULT (Fallback)</option>
                                <option value="CATEGORY">KATEGORİ</option>
                                <option value="BRAND">MARKA</option>
                            </select>

                            <input type="text" placeholder="Cat/Brand ID" value={r.category || r.brand || ''} onChange={e => {
                                const newRules = [...selectedPlan.rules];
                                if (r.matchType === 'CATEGORY') newRules[idx].category = e.target.value;
                                else newRules[idx].brand = e.target.value;
                                setSelectedPlan({ ...selectedPlan, rules: newRules });
                            }} className="w-32 text-sm border p-1 rounded" />

                            <input type="number" step="0.01" placeholder="Yüzde (%)" value={r.ratePercentage || 0} onChange={e => {
                                const newRules = [...selectedPlan.rules];
                                newRules[idx].ratePercentage = parseFloat(e.target.value);
                                setSelectedPlan({ ...selectedPlan, rules: newRules });
                            }} className="w-24 text-sm border p-1 rounded" />

                            <input type="number" step="0.01" placeholder="Sabit (₺)" value={r.fixedFee || 0} onChange={e => {
                                const newRules = [...selectedPlan.rules];
                                newRules[idx].fixedFee = parseFloat(e.target.value);
                                setSelectedPlan({ ...selectedPlan, rules: newRules });
                            }} className="w-24 text-sm border p-1 rounded" />

                            <button onClick={() => {
                                const newRules = selectedPlan.rules.filter((_: any, i: number) => i !== idx);
                                setSelectedPlan({ ...selectedPlan, rules: newRules });
                            }} className="text-red-500 font-bold ml-auto px-2">X</button>
                        </div>
                    ))}

                    <button onClick={() => setSelectedPlan({ ...selectedPlan, rules: [...(selectedPlan.rules || []), { matchType: 'DEFAULT', ratePercentage: 0, priority: 0 }] })} className="text-sm text-blue-600 font-semibold mb-6">+ Kural Ekle</button>

                    <div className="border-t pt-4 space-y-3">
                        <input type="text" placeholder="Finans Denetim Kaydı için Sebep Girmek Zorunludur" value={reason} onChange={e => setReason(e.target.value)} className="w-full text-sm p-3 border border-red-200 bg-red-50 rounded" />
                        <div className="flex gap-2">
                            <button onClick={() => handleSave(!selectedPlan.id)} disabled={saving} className="flex-1 py-2 bg-slate-900 text-white font-semibold rounded hover:bg-black">
                                {saving ? "Kaydediliyor..." : selectedPlan.id ? "Güncelle ve Uygula" : "Yeni Plan Oluştur"}
                            </button>
                            <button onClick={() => setSelectedPlan(null)} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded hover:bg-slate-300">İptal</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-slate-700">Plan Adı</th>
                                <th className="p-4 font-semibold text-slate-700">Kapsam</th>
                                <th className="p-4 font-semibold text-slate-700">Durum</th>
                                <th className="p-4 font-semibold text-slate-700">Kural Sayısı</th>
                                <th className="p-4 font-semibold text-slate-700">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {plans.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{p.name}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${p.scope === 'GLOBAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.scope}</span></td>
                                    <td className="p-4">{p.isDefault ? <span className="text-emerald-600 font-bold text-xs ring-1 ring-emerald-200 bg-emerald-50 px-2 py-1 flex max-w-min items-center">AKTİF</span> : <span className="text-slate-400">Pasif</span>}</td>
                                    <td className="p-4">{p.ruleCount}</td>
                                    <td className="p-4 flex gap-3 text-xs">
                                        <button onClick={() => fetchPlanDetails(p.id)} className="text-blue-600 hover:underline font-semibold">Düzenle</button>
                                        <button onClick={() => handleArchive(p.id)} className="text-red-500 hover:underline">Arşivle</button>
                                    </td>
                                </tr>
                            ))}
                            {plans.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">Kayıtlı politika bulunamadı.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
