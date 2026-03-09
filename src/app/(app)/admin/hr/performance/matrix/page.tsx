"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton, EnterpriseInput } from '@/components/ui/enterprise';
import { Network, ServerCog, Target, Zap, Clock, TrendingUp } from 'lucide-react';

export default function PerformanceMatrixAdmin() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<any>(null);

    const [form, setForm] = useState({
        year: 2026,
        totalTarget: 4000000,
        bonusPool: 160000,
        staffIds: [] as string[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hr/performance/matrix');
            const d = await res.json();
            if (d.success) setData(d);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMatrix = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/hr/performance/matrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                alert("Target Matrix (Hedef Matrisi) başarıyla oluşturuldu ve Personele dağıtıldı!");
                setForm({ ...form, totalTarget: 0, bonusPool: 0, staffIds: [] });
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || "Bir hata oluştu");
            }
        } catch (error) {
            alert("Sistem Hatası");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStaffSelection = (staffId: string) => {
        if (form.staffIds.includes(staffId)) {
            setForm({ ...form, staffIds: form.staffIds.filter(id => id !== staffId) });
        } else {
            setForm({ ...form, staffIds: [...form.staffIds, staffId] });
        }
    };

    return (
        <EnterprisePageShell
            title="Sales Target Matrix (Hedef Yönetimi)"
            description="Tüm şirket çapında yıllık satış hedeflerini, Q1-Q4 periyotlarını ve bonus bütçelerini dağıtın."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Target Matrix Generator */}
                <div className="lg:col-span-1 space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Yeni Growth Matrix" icon={<Network />} />
                        <form onSubmit={handleCreateMatrix} className="mt-4 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Yıl Performans Dönemi</label>
                                <input
                                    type="number"
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-black focus:outline-none focus:border-indigo-500"
                                    value={form.year}
                                    onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Şirket Genel Yıllık Satış Hedefi (₺)</label>
                                <input
                                    type="number"
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
                                    value={form.totalTarget}
                                    onChange={e => setForm({ ...form, totalTarget: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Dağıtılabilir Toplam Bonus Bütçesi (₺)</label>
                                <input
                                    type="number"
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-black text-amber-700 focus:outline-none focus:border-amber-500"
                                    value={form.bonusPool}
                                    onChange={e => setForm({ ...form, bonusPool: Number(e.target.value) })}
                                />
                            </div>

                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Hedef Dağıtılacak Personeller ({form.staffIds.length} Seçili)</label>
                                {loading ? (
                                    <div className="text-xs text-slate-400">Yükleniyor...</div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {data?.staffList?.map((staff: any) => (
                                            <div
                                                key={staff.id}
                                                onClick={() => toggleStaffSelection(staff.id)}
                                                className={`p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${form.staffIds.includes(staff.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {form.staffIds.includes(staff.id) && <span className="mr-2">✓</span>}
                                                {staff.name} <span className="opacity-50">({staff.role})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || form.staffIds.length === 0}
                                className="w-full mt-2 py-3 bg-slate-900 border border-black hover:bg-slate-800 text-white rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg"
                            >
                                {submitting ? 'DAĞITILIYOR...' : '🎯 MATRIX OLUŞTUR VE DAĞIT'}
                            </button>
                        </form>
                    </EnterpriseCard>

                    <EnterpriseCard className="bg-gradient-to-br from-slate-900 to-black border-slate-800 text-white">
                        <div className="flex gap-4">
                            <ServerCog className="w-8 h-8 text-amber-500 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold mb-1">Algoritma Devrede</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Periodya Matrix Engine belirlediğiniz yıllık hedefleri Q1, Q2, Q3 ve Q4 çeyreklerine böler ve seçili personele eşit ağırlıkta (`0.25`) dağıtır.
                                </p>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Right Col: Existing Matrices Overview */}
                <div className="lg:col-span-2">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Aktif Hedef Matrisleri" subtitle="Şu an yayında olan planlar ve durumları" icon={<TrendingUp />} />
                        <div className="mt-6 space-y-6">
                            {loading ? (
                                <div className="text-center text-slate-500 text-sm py-10">Veri Bekleniyor...</div>
                            ) : data?.plans?.length === 0 ? (
                                <div className="text-center text-slate-500 text-sm py-10 border border-dashed border-slate-200 rounded-xl">
                                    Henüz tanımlanmış bir Hedef Matrisi (Target Plan) bulunmamaktadır.
                                </div>
                            ) : data?.plans?.map((plan: any) => (
                                <div key={plan.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">{plan.year} - {plan.mode} STRATEJİSİ</h3>
                                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Yıllık Hedef: <span className="text-emerald-600">{Number(plan.totalTarget).toLocaleString()} ₺</span> | Bonus Havuzu: <span className="text-amber-600">{Number(plan.bonusPool).toLocaleString()} ₺</span></p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg tracking-widest">PUBLISHED</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {plan.periods?.map((per: any) => (
                                            <div key={per.id} className="bg-white border text-center p-3 rounded-xl border-slate-100 shadow-sm relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-blue-50/50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                                <h4 className="relative z-10 text-xs font-black text-slate-700">{per.name} (Q{per.name.replace('Q', '')})</h4>
                                                <p className="relative z-10 text-[10px] text-slate-400 font-bold mb-2">Ağırlık: %{Number(per.weight) * 100}</p>
                                                <div className="relative z-10 text-sm font-black text-slate-900 border-t border-slate-100 pt-2 shadow-sm">
                                                    {Number(per.targetAmount).toLocaleString()} ₺
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-600 font-medium">
                                        Bu periyotlara <strong className="text-indigo-600">{plan.periods[0]?.assignments?.length || 0}</strong> personel atanmış durumda. Dönem sonunda `Kümülatif Kurtarma` mekanizması otomatik devreye girecektir.
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
