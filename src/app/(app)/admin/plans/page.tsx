
"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function AdminPlans() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [plans, setPlans] = useState<any[]>([]);
    const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '' as string | number,
        interval: 'MONTHLY',
        isActive: true,
        limits: {
            monthly_documents: 100,
            companies: 1,
            users: 1,
            branches: 1
        },
        selectedFeatures: [] as string[]
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [plansRes, featsRes] = await Promise.all([
                fetch('/api/billing/plans'),
                fetch('/api/admin/features')
            ]);
            const plansData = await plansRes.json();
            const featsData = await featsRes.json();
            setPlans(plansData);
            setAvailableFeatures(featsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingPlanId ? `/api/billing/plans/${editingPlanId}` : '/api/billing/plans';
        const method = editingPlanId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    features: formData.selectedFeatures
                })
            });
            if (res.ok) {
                setShowModal(false);
                setEditingPlanId(null);
                loadData();
                resetForm();
            } else {
                const err = await res.json();
                showError('Hata', err.error || 'Hata oluştu');
            }
        } catch (e) {
            showError('Hata', 'Bağlantı hatası');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            interval: 'MONTHLY',
            isActive: true,
            limits: { monthly_documents: 100, companies: 1, users: 1, branches: 1 },
            selectedFeatures: []
        });
        setEditingPlanId(null);
    };

    const handleEdit = (plan: any) => {
        setEditingPlanId(plan.id);

        // Convert array limits to object if needed
        const limitObj = { monthly_documents: 0, companies: 1, users: 1, branches: 1 };
        if (Array.isArray(plan.limits)) {
            plan.limits.forEach((l: any) => {
                if (l.resource === 'monthly_documents') limitObj.monthly_documents = l.limit;
                if (l.resource === 'companies') limitObj.companies = l.limit;
                if (l.resource === 'users') limitObj.users = l.limit;
                if (l.resource === 'branches') limitObj.branches = l.limit;
            });
        }

        setFormData({
            name: plan.name,
            description: plan.description || '',
            price: plan.price,
            interval: plan.interval || 'MONTHLY',
            isActive: plan.isActive ?? true,
            limits: limitObj,
            selectedFeatures: Array.isArray(plan.features)
                ? plan.features
                    .map((f: any) => typeof f === 'string' ? f : (f.id || f.key))
                    .filter((id: string) => availableFeatures.some(af => af.id === id))
                : []
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        showConfirm('Paketi Sil', 'Bu paketi silmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/billing/plans/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Başarılı', 'Paket silindi.');
                    loadData();
                } else {
                    const err = await res.json();
                    showError('Hata', err.error || 'Silme işlemi başarısız.');
                }
            } catch (e) {
                showError('Hata', 'Bağlantı hatası');
            }
        });
    };

    const toggleFeature = (id: string) => {
        setFormData(prev => ({
            ...prev,
            selectedFeatures: prev.selectedFeatures.includes(id)
                ? prev.selectedFeatures.filter(fid => fid !== id)
                : [...prev.selectedFeatures, id]
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Paketler & Fiyatlandırma</h1>
                    <p className="text-slate-500 text-sm">Abonelik planlarını ve fiyatlarını yönetin.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95"
                >
                    + Yeni Paket Ekle
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium">Veriler yükleniyor...</div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Adı</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fiyat</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periyot</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aktif Üyeler</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Metrikler (Limit)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Modül Yetkileri</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"> İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {plans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{plan.name}</div>
                                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{plan.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 font-bold">
                                        {plan.price === 0 ? <span className="text-emerald-600">Ücretsiz</span> : `₺${plan.price.toLocaleString()}`}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{plan.interval === 'MONTHLY' ? 'Aylık' : 'Yıllık'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                                            {plan.members || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-slate-500 font-mono leading-relaxed">
                                        <div className="space-y-0.5">
                                            {Array.isArray(plan.limits) ? (
                                                plan.limits.map((l: any, i: number) => (
                                                    <div key={i} className="flex gap-2">
                                                        <span className="text-slate-400 uppercase w-8">{l.resource.substring(0, 3)}:</span>
                                                        <span className="font-bold">{l.limit === -1 ? '∞' : l.limit}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <>
                                                    <span className="text-slate-400">DOC:</span> {plan.limits?.monthly_documents}<br />
                                                    <span className="text-slate-400">USR:</span> {plan.limits?.users}<br />
                                                    <span className="text-slate-400">BRN:</span> {plan.limits?.branches || 1}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {plan.features?.length > 0 ? plan.features
                                                .filter((f: any) => {
                                                    const fId = typeof f === 'string' ? f : (f.id || f.key);
                                                    return availableFeatures.some(af => af.id === fId || af.key === fId);
                                                })
                                                .map((f: any, i: number) => (
                                                    <span key={i} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-100 whitespace-nowrap">
                                                        {typeof f === 'string' ? f : (f.name || f.key || 'Limit')}
                                                    </span>
                                                )) : (
                                                <span className="text-[9px] text-slate-300 italic">Standart Özellikler</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${plan.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {plan.isActive ? 'AKTİF' : 'PASİF'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleEdit(plan)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(plan.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh] border border-slate-200">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editingPlanId ? 'Paketi Düzenle' : 'Yeni Abonelik Paketi'}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Standard</span>
                                    <p className="text-xs text-slate-500 font-medium">E-fatura & E-arşiv & E-irsaliye her zaman dahildir.</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowModal(false); setEditingPlanId(null); }} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Left Section: Basic & Limits */}
                                <div className="lg:col-span-7 space-y-8">
                                    <div className="space-y-5">
                                        <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-6 h-[1px] bg-blue-600"></span> Paket Detayları
                                        </h4>
                                        <div className="grid grid-cols-1 gap-5">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Plan İsmi</label>
                                                <input
                                                    type="text" required value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full border border-slate-200 bg-slate-50/50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                                                    placeholder="Örn: Kurumsal Pro"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Kısa Açıklama</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full border border-slate-200 bg-slate-50/50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all h-20 text-sm text-slate-600 font-medium"
                                                    placeholder="Paket avantajlarından bahsedin..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Ücret (₺)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                                                        <input
                                                            type="number" required value={formData.price}
                                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                            className="w-full border border-slate-200 bg-slate-50/50 p-4 pl-8 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-xl text-slate-900"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Yenileme</label>
                                                    <select
                                                        value={formData.interval}
                                                        onChange={e => setFormData({ ...formData, interval: e.target.value })}
                                                        className="w-full border border-slate-200 bg-slate-50/50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none"
                                                    >
                                                        <option value="MONTHLY">Her Ay</option>
                                                        <option value="YEARLY">Yıllık Ödeme</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-6 h-[1px] bg-amber-600"></span> Kaynak Limitleri
                                        </h4>
                                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl grid grid-cols-2 gap-6 shadow-inner">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-black text-slate-400 mb-2 tracking-tight">AYLIK FATURA / BELGE ADEDİ</label>
                                                <input
                                                    type="number" value={formData.limits.monthly_documents}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        limits: { ...formData.limits, monthly_documents: Number(e.target.value) }
                                                    })}
                                                    className="w-full border border-slate-200 bg-white p-4 rounded-xl text-2xl font-black text-slate-900 shadow-sm"
                                                />
                                                <p className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-tighter">* Sınırsız için -1 tanımlayın.</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 mb-2 tracking-tight">MAX. ŞUBE / TERMINAL</label>
                                                <input
                                                    type="number" value={formData.limits.branches}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        limits: { ...formData.limits, branches: Number(e.target.value) }
                                                    })}
                                                    className="w-full border border-slate-200 bg-white p-4 rounded-xl text-xl font-black text-slate-900 shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 mb-2 tracking-tight">MAX. KULLANICI</label>
                                                <input
                                                    type="number" value={formData.limits.users}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        limits: { ...formData.limits, users: Number(e.target.value) }
                                                    })}
                                                    className="w-full border border-slate-200 bg-white p-4 rounded-xl text-xl font-black text-slate-900 shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Features Grid */}
                                <div className="lg:col-span-5 space-y-5">
                                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-6 h-[1px] bg-indigo-600"></span> Modül & Fonksiyon Yetkileri
                                    </h4>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                                        {availableFeatures.map(feat => {
                                            const isSelected = formData.selectedFeatures.includes(feat.id);
                                            return (
                                                <label
                                                    key={feat.id}
                                                    className={`group flex items-start gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                        : 'border-white bg-white hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className="relative flex items-center mt-1">
                                                        <input
                                                            type="checkbox"
                                                            className="peer sr-only"
                                                            checked={isSelected}
                                                            onChange={() => toggleFeature(feat.id)}
                                                        />
                                                        <div className="w-5 h-5 border-2 border-slate-200 rounded-lg peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                            <svg className={`w-3 h-3 text-white ${isSelected ? 'scale-100' : 'scale-0'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`text-sm font-black ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>{feat.name}</div>
                                                        <div className={`text-[10px] leading-tight mt-1 font-medium ${isSelected ? 'text-indigo-700/70' : 'text-slate-400'}`}>{feat.description}</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100 px-2 lg:px-4">
                                <button
                                    type="button" onClick={() => setShowModal(false)}
                                    className="px-8 py-5 border-2 border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:text-slate-800 font-black transition-all order-2 sm:order-1"
                                >
                                    Vazgeç ve Kapat
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 font-black shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 text-lg order-1 sm:order-2"
                                >
                                    {editingPlanId ? 'Değişiklikleri Kaydet ✨' : 'Paketi Şimdi Tanımla 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

