"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Percent, Plus, Save, Archive, Edit2, AlertCircle, X, Check, Search, Filter } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export default function CommissionsPage() {
    const { showSuccess, showError, showPrompt } = useModal();
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
            showSuccess("Bilgi", "Mali denetim logu için işlem sebebi girmek zorunludur.");
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
                showSuccess("Bilgi", "Komisyon planı başarıyla kaydedildi.");
                setReason("");
                setSelectedPlan(null);
                fetchPlans();
            } else {
                showError("Uyarı", `Hata: ${(await res.json()).error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (id: string) => {
        showPrompt("Planı Arşivle", "Bu komisyon planını arşive kaldırmak (deaktif etmek) için bir sebep girin:", async (confirmReason) => {
            if (!confirmReason || confirmReason.trim().length < 5) return;

            try {
                const res = await fetch(`/api/admin/payments-escrow/commissions/plans/${id}/archive`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: confirmReason }),
                });

                if (res.ok) {
                    showSuccess("Bilgi", "Plan başarıyla arşivlendi.");
                    fetchPlans();
                } else {
                    showError("Hata", "Plan arşivlenemedi.");
                }
            } catch (e) {
                showError("Uyarı", "Bağlantı hatası");
            }
        });
    };

    if (loading && !plans.length) return (
        <div className="flex items-center justify-center h-64 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <EnterprisePageShell
            title="Yönetim"
            description="Sistem detaylarını yapılandırın"
        >
            <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <Percent className="w-6 h-6 text-indigo-500" />
                            Komisyon Politikaları
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            B2B ağındaki satıcıların (Tenant) satışlarından alınacak platform komisyon oranları ve istisna kuralları.
                        </p>
                    </div>
                    {!selectedPlan && (
                        <button onClick={() => setSelectedPlan({ name: '', isDefault: false, scope: 'GLOBAL', currency: 'TRY', rules: [] })} className="px-4 py-2 flex items-center gap-2 bg-indigo-600 border border-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 hover:border-indigo-700 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> Yeni Plan Tasarla
                        </button>
                    )}
                </div>

                {selectedPlan ? (
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col lg:flex-row">
                        {/* Sol Panel - Tanım */}
                        <div className="lg:w-1/3 p-6 xl:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Edit2 className="w-5 h-5 text-indigo-500" />
                                    {selectedPlan.id ? 'Planı Düzenle' : 'Yeni Komisyon Planı'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Bu politika kurallara göre uygulanacaktır.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Plan Adı</label>
                                    <input type="text" value={selectedPlan.name} onChange={e => setSelectedPlan({ ...selectedPlan, name: e.target.value })} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" placeholder="Giyim Kategorisi %5 Planı..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Kapsam (Scope)</label>
                                    <select value={selectedPlan.scope} onChange={e => setSelectedPlan({ ...selectedPlan, scope: e.target.value })} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                                        <option value="GLOBAL">Platform Geneli (GLOBAL)</option>
                                        <option value="COMPANY_OVERRIDE">Firma Özel Geçersiz Kılma (OVERRIDE)</option>
                                    </select>
                                </div>
                                {selectedPlan.scope === 'COMPANY_OVERRIDE' && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1"><Search className="w-3 h-3" /> Firma ID (Tenant ID)</label>
                                        <input type="text" value={selectedPlan.companyId || ''} onChange={e => setSelectedPlan({ ...selectedPlan, companyId: e.target.value })} className="w-full p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-sm font-mono text-indigo-900 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" placeholder="tenant_id_c..." />
                                    </div>
                                )}

                                <label className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${selectedPlan.isDefault ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-500/30' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                    <div className="pt-0.5">
                                        <input type="checkbox" checked={selectedPlan.isDefault} onChange={e => setSelectedPlan({ ...selectedPlan, isDefault: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer" />
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${selectedPlan.isDefault ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>Varsayılan Yap (Fallback)</div>
                                        <div className={`text-xs mt-0.5 ${selectedPlan.isDefault ? 'text-emerald-600/80 dark:text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>Sadece tek bir plan varsayılan olabilir. Eşleşen kural bulunamazsa bu kullanılır.</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Sağ Panel - Kurallar */}
                        <div className="lg:w-2/3 flex flex-col h-full bg-white dark:bg-[#1e293b]">
                            <div className="p-6 xl:p-8 flex-1">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Filter className="w-5 h-5 text-indigo-500" /> Hesaplama Kuralları (Rules Engine)
                                    </h3>
                                    <button onClick={() => setSelectedPlan({ ...selectedPlan, rules: [...(selectedPlan.rules || []), { matchType: 'DEFAULT', ratePercentage: 0, priority: 0 }] })} className="text-sm bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Kural Ekle
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(!selectedPlan.rules || selectedPlan.rules.length === 0) ? (
                                        <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                                            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Bu plana henüz hiçbir kural eklenmedi.</p>
                                        </div>
                                    ) : (
                                        selectedPlan.rules.map((r: any, idx: number) => (
                                            <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 p-4 border border-slate-200 dark:border-white/10 rounded-xl items-center bg-white dark:bg-[#111c30] group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                                                <div className="w-full sm:w-1/4">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hedef (Target)</label>
                                                    <select value={r.matchType} onChange={e => {
                                                        const newRules = [...selectedPlan.rules];
                                                        newRules[idx].matchType = e.target.value;
                                                        setSelectedPlan({ ...selectedPlan, rules: newRules });
                                                    }} className="w-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-lg outline-none">
                                                        <option value="DEFAULT">DEFAULT (Tümü)</option>
                                                        <option value="CATEGORY">KATEGORİ SPESİFİK</option>
                                                        <option value="BRAND">MARKA SPESİFİK</option>
                                                    </select>
                                                </div>

                                                <div className="w-full sm:w-1/4">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Eşleşme Kriteri</label>
                                                    <input type="text" placeholder={r.matchType === 'DEFAULT' ? "Her şeye uygulanır" : "ID Girin"} value={r.matchType === 'CATEGORY' ? r.category : r.matchType === 'BRAND' ? r.brand : ''} disabled={r.matchType === 'DEFAULT'} onChange={e => {
                                                        const newRules = [...selectedPlan.rules];
                                                        if (r.matchType === 'CATEGORY') newRules[idx].category = e.target.value;
                                                        else newRules[idx].brand = e.target.value;
                                                        setSelectedPlan({ ...selectedPlan, rules: newRules });
                                                    }} className="w-full text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded-lg outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800" />
                                                </div>

                                                <div className="w-1/2 sm:w-1/5">
                                                    <label className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">Yüzde (%)</label>
                                                    <input type="number" step="0.01" placeholder="örn: 5.5" value={r.ratePercentage || 0} onChange={e => {
                                                        const newRules = [...selectedPlan.rules];
                                                        newRules[idx].ratePercentage = parseFloat(e.target.value);
                                                        setSelectedPlan({ ...selectedPlan, rules: newRules });
                                                    }} className="w-full text-sm font-black text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg outline-none" />
                                                </div>

                                                <div className="w-1/2 sm:w-1/5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sabit Tutar (₺)</label>
                                                    <input type="number" step="0.01" placeholder="örn: 2.50" value={r.fixedFee || 0} onChange={e => {
                                                        const newRules = [...selectedPlan.rules];
                                                        newRules[idx].fixedFee = parseFloat(e.target.value);
                                                        setSelectedPlan({ ...selectedPlan, rules: newRules });
                                                    }} className="w-full text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 rounded-lg outline-none" />
                                                </div>

                                                <div className="w-full sm:w-auto mt-4 sm:mt-0 flex justify-end">
                                                    <button onClick={() => {
                                                        const newRules = selectedPlan.rules.filter((_: any, i: number) => i !== idx);
                                                        setSelectedPlan({ ...selectedPlan, rules: newRules });
                                                    }} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-6 xl:p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 mt-auto flex flex-col sm:flex-row items-end gap-4">
                                <div className="flex-1 w-full relative group">
                                    <AlertCircle className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
                                    <input type="text" placeholder="Mali Denetim (Audit Log) İçin Kayıt Sebebi..." value={reason} onChange={e => setReason(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm font-medium border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/50 outline-none rounded-xl" />
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                    <button onClick={() => setSelectedPlan(null)} className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors cursor-pointer">İptal Vazgeç</button>
                                    <button onClick={() => handleSave(!selectedPlan.id)} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                                        <Save className="w-4 h-4" />
                                        {saving ? "Kaydediliyor..." : selectedPlan.id ? "Güncelle ve İmza At" : "Oluştur ve Aktar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-[11px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                                    <tr>
                                        <th className="py-4 px-6">Plan Adı</th>
                                        <th className="py-4 px-6">Kapsam Modeli</th>
                                        <th className="py-4 px-6">Durum (State)</th>
                                        <th className="py-4 px-6 text-center">İç Kural Sayısı</th>
                                        <th className="py-4 px-6 text-right">Aksiyonlar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {loading && plans.length === 0 && <tr><td colSpan={5} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500 font-medium">Politikalar Yükleniyor...</td></tr>}
                                    {!loading && plans.length === 0 && <tr><td colSpan={5} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500 font-medium flex-col items-center">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" /> Kayıtlı Komisyon Politikası Bulunamadı
                                    </td></tr>}

                                    {plans?.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{p.name}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${p.scope === 'GLOBAL' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:border-fuchsia-500/30 dark:text-fuchsia-400'}`}>
                                                    {p.scope === 'GLOBAL' ? 'Platform Geneli' : 'Firma Özel (Override)'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {p.isDefault ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 w-max rounded-md text-[10px] uppercase font-bold tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500/30 dark:text-emerald-400">
                                                        <Check className="w-3.5 h-3.5" /> VARSAYILAN AKTİF
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-slate-100 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">Pasif / Geçersiz</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm">{p.ruleCount || 0}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <button onClick={() => fetchPlanDetails(p.id)} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm cursor-pointer">Düzenle</button>
                                                {!p.isDefault && (
                                                    <button onClick={() => handleArchive(p.id)} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg text-[11px] font-bold border border-rose-200 dark:border-rose-900 transition-colors shadow-sm cursor-pointer ml-2">Arşivle</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </EnterprisePageShell>
    );
}