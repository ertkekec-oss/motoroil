"use client";

import React, { useState, useEffect } from 'react';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput } from "@/components/ui/enterprise";

export default function GatewaysPage() {
    const [gateways, setGateways] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        provider: 'IYZICO',
        isActive: false,
        isTestMode: true,
        apiKey: '',
        apiSecret: '',
        merchantId: '',
        supportedTypes: [] as string[]
    });

    useEffect(() => {
        fetchGateways();
    }, []);

    const fetchGateways = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/gateways');
            const data = await res.json();
            if (data.success) {
                setGateways(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch gateways', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const method = editingId ? 'PUT' : 'POST';
            const payload = { ...form, id: editingId };

            const res = await fetch('/api/admin/gateways', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setModalOpen(false);
                fetchGateways();
            } else {
                alert(data.error || 'Kaydetme başarısız');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Emin misiniz?')) return;
        try {
            await fetch(`/api/admin/gateways?id=${id}`, { method: 'DELETE' });
            fetchGateways();
        } catch (error) {
            console.error(error);
        }
    };

    const toggleSupportedType = (type: string) => {
        setForm(prev => ({
            ...prev,
            supportedTypes: prev.supportedTypes.includes(type)
                ? prev.supportedTypes.filter(t => t !== type)
                : [...prev.supportedTypes, type]
        }));
    };

    const openEdit = (gw: any) => {
        setEditingId(gw.id);
        setForm({
            provider: gw.provider,
            isActive: gw.isActive,
            isTestMode: gw.isTestMode,
            apiKey: gw.apiKey || '',
            apiSecret: gw.apiSecret || '',
            merchantId: gw.merchantId || '',
            supportedTypes: gw.supportedTypes || []
        });
        setModalOpen(true);
    };

    const openNew = () => {
        setEditingId(null);
        setForm({
            provider: 'IYZICO',
            isActive: false,
            isTestMode: true,
            apiKey: '',
            apiSecret: '',
            merchantId: '',
            supportedTypes: ['SAAS', 'SMS', 'EINVOICE']
        });
        setModalOpen(true);
    };

    return (
        <EnterprisePageShell
            title="Ödeme Altyapıları (Gateways)"
            description="Tüm ödeme servis sağlayıcıları, aktif/pasif modları ve destekledikleri faturalandırma tipleri."
            action={{
                label: "+ Yeni Gateway Ekle",
                onClick: openNew
            }}
        >
            <div className="space-y-6">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {gateways.map(gw => (
                            <EnterpriseCard key={gw.id} className="p-6 relative group border-t-4 data-[active=true]:border-emerald-500 data-[active=false]:border-slate-300" data-active={gw.isActive}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">{gw.provider}</h3>
                                        <div className="flex gap-2 mt-2">
                                            {gw.isActive ? (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">AKTİF</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">PASİF</span>
                                            )}
                                            {gw.isTestMode && (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">TEST MODU</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(gw)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[12px] rounded-lg">Düzenle</button>
                                        <button onClick={() => handleDelete(gw.id)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[12px] rounded-lg">Sil</button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-white/5">
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Desteklenen İşlemler</div>
                                        <div className="flex flex-wrap gap-2">
                                            {['SAAS', 'SMS', 'EINVOICE'].map(typ => (
                                                <div key={typ} className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold border transition-colors ${gw.supportedTypes.includes(typ) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-400 opacity-50'}`}>
                                                    {typ === 'SAAS' && 'SaaS Planları'}
                                                    {typ === 'SMS' && 'SMS Paketleri'}
                                                    {typ === 'EINVOICE' && 'E-Fatura Kontörü'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </EnterpriseCard>
                        ))}

                        {gateways.length === 0 && (
                            <div className="col-span-1 lg:col-span-2 p-12 text-center text-slate-500 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5">
                                Kayıtlı ödeme altyapısı bulunmuyor. Yeni Gateway ekleyin.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#0f172a] rounded-[24px] shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                {editingId ? 'Gateway Düzenle' : 'Yeni Gateway Ekle'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scroll space-y-6">
                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 uppercase mb-2">Sağlayıcı (Provider)</label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 font-bold outline-none focus:border-blue-500 transition-colors"
                                    value={form.provider}
                                    onChange={e => setForm({ ...form, provider: e.target.value })}
                                >
                                    <option value="IYZICO">IYZICO</option>
                                    <option value="PAYTR">PAYTR</option>
                                    <option value="PAYNET">PAYNET</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={form.isActive}
                                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                    />
                                    <div>
                                        <div className="font-bold text-[14px]">Aktif Kullanım</div>
                                        <div className="text-[11px] text-slate-500 font-medium">Bu gateway ile ödeme alınsın mı?</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                        checked={form.isTestMode}
                                        onChange={e => setForm({ ...form, isTestMode: e.target.checked })}
                                    />
                                    <div>
                                        <div className="font-bold text-[14px]">Test Modu</div>
                                        <div className="text-[11px] text-slate-500 font-medium">Live ortam yerine sandbox kullanılır.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
                                <EnterpriseSectionHeader title="Kimlik Bilgileri (API)" description="Ödeme kuruluşunun size sağladığı anahtarlar." />
                                <EnterpriseInput value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="API Key" />
                                <EnterpriseInput value={form.apiSecret} onChange={e => setForm({ ...form, apiSecret: e.target.value })} placeholder="API Secret" type="password" />
                                <EnterpriseInput value={form.merchantId} onChange={e => setForm({ ...form, merchantId: e.target.value })} placeholder="Merchant ID (Gerekliyse)" />
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
                                <EnterpriseSectionHeader title="Desteklenen Ürünler" description="Bu ağ geçidinin hangi ürün tiplerinde ödeme almasını istiyorsunuz?" />

                                <div className="flex flex-col gap-3">
                                    {['SAAS', 'SMS', 'EINVOICE'].map(typ => (
                                        <label key={typ} className="flex items-center justify-between p-3 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                            <div className="font-bold text-[13px]">
                                                {typ === 'SAAS' && 'SaaS Platform Planları'}
                                                {typ === 'SMS' && 'SMS Hizmet Paketleri'}
                                                {typ === 'EINVOICE' && 'E-Fatura Mühür Kontörü'}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600"
                                                checked={form.supportedTypes.includes(typ)}
                                                onChange={() => toggleSupportedType(typ)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-[24px]">
                            <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200/50 transition-colors">İptal</button>
                            <button onClick={handleSave} className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md">Kaydet & Uygula</button>
                        </div>
                    </div>
                </div>
            )}
        </EnterprisePageShell>
    );
}
