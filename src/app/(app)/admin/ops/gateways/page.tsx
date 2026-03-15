"use client";

import React, { useState, useEffect } from 'react';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseInput,
    EnterpriseButton,
    EnterpriseEmptyState,
    EnterpriseSelect,
    EnterpriseSwitch,
    EnterpriseField
} from "@/components/ui/enterprise";
import { Server, Settings, Plus, Key, Link2, CreditCard, Trash2, Edit2, ShieldCheck, Activity } from 'lucide-react';
import { useModal } from "@/contexts/ModalContext";

export default function GatewaysPage() {
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
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
                showSuccess("Başarılı", "Gateway yapılandırması kaydedildi.");
                setModalOpen(false);
                fetchGateways();
            } else {
                showError("Hata", data.error || 'Kaydetme başarısız');
            }
        } catch (error) {
            console.error(error);
            showError("Hata", "İşlem sırasında sunucu hatası oluştu.");
        }
    };

    const handleDelete = (id: string) => {
        showConfirm("Gateway Silme", "Bu ağ geçidini kalıcı olarak silmek istediğinize emin misiniz? (Ödemeler durabilir)", async () => {
            try {
                const res = await fetch(`/api/admin/gateways?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess("Bilgi", "Gateway başarıyla silindi.");
                    fetchGateways();
                } else {
                    showError("Hata", "Gateway silinemedi.");
                }
            } catch (error) {
                console.error(error);
                showError("Hata", "Silme işlemi sırasında hata oluştu.");
            }
        });
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
            title="Ödeme & Gateway Altyapıları"
            description="Tüm ödeme servis sağlayıcıları (PSP), komisyon oranları ve API entegrasyon ayarları."
            actions={
                <EnterpriseButton onClick={openNew} variant="primary">
                    <Plus className="w-4 h-4" /> Yeni Gateway Ekle
                </EnterpriseButton>
            }
        >
            <div className="space-y-6">
                {loading ? (
                    <div className="py-20 flex justify-center text-slate-400">Yükleniyor...</div>
                ) : (
                    <>
                        {gateways.length === 0 ? (
                            <EnterpriseEmptyState
                                icon={<Server />}
                                title="Hiçbir Gateway Yapılandırılmadı"
                                description="SaaS ödemeleri veya kontör satışları için sisteminize en az bir ödeme sağlayıcısı (Iyzico, PayTR vb.) eklemeniz gerekmektedir."
                                action={
                                    <EnterpriseButton onClick={openNew} variant="primary">
                                        <Plus className="w-4 h-4" /> İlk Sağlayıcıyı Kur
                                    </EnterpriseButton>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {gateways.map(gw => (
                                    <EnterpriseCard
                                        key={gw.id}
                                        className="relative group transition-all hover:shadow-md"
                                        borderLeftColor={gw.isActive ? '#10b981' : '#cbd5e1'}
                                        noPadding={true}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${gw.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                                        <CreditCard className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{gw.provider}</h3>
                                                        <div className="flex gap-2 mt-1">
                                                            {gw.isActive ? (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                                                    <Activity className="w-3 h-3" /> CANLI
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">PASİF</span>
                                                            )}
                                                            {gw.isTestMode && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">SANDBOX</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(gw)} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(gw.id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Desteklenen Akışlar</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['SAAS', 'SMS', 'EINVOICE'].map(typ => (
                                                            <div
                                                                key={typ}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${(gw.supportedTypes || []).includes(typ) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-400 opacity-50'}`}
                                                            >
                                                                {typ === 'SAAS' && 'SaaS Abonelikleri'}
                                                                {typ === 'SMS' && 'SMS Paketleri'}
                                                                {typ === 'EINVOICE' && 'E-Fatura Kontör'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 pt-3">
                                                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50">
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase">API Key (Masked)</div>
                                                        <div className="text-sm font-mono mt-0.5 text-slate-700 dark:text-slate-300">
                                                            {gw.apiKey ? `****${String(gw.apiKey).slice(-5)}` : 'Girilmedi'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </EnterpriseCard>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-blue-600" />
                                    {editingId ? 'Entegrasyonu Düzenle' : 'Yeni Entegrasyon Kur'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Ödeme altyapısı sağlayıcısının API anahtarlarını girin.</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">✕</button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scroll space-y-8 bg-slate-50/50 dark:bg-slate-900/50">

                            <EnterpriseField label="Ağ Geçidi (Provider)">
                                <EnterpriseSelect
                                    value={form.provider}
                                    onChange={e => setForm({ ...form, provider: e.target.value })}
                                >
                                    <option value="IYZICO">Iyzico Ödeme Sistemleri</option>
                                    <option value="PAYTR">PayTR Sanal POS</option>
                                    <option value="PAYNET">Paynet B2B POS</option>
                                </EnterpriseSelect>
                            </EnterpriseField>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <EnterpriseSwitch
                                    label="Aktif Sistem Olarak Kullan"
                                    description="Seçilen ödeme senaryolarında bu sağlayıcı kullanılacak."
                                    checked={form.isActive}
                                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                />
                                <EnterpriseSwitch
                                    label="Test Ortamı (Sandbox)"
                                    description="Gerçek para çekilmez, test kartları ile çalışır."
                                    checked={form.isTestMode}
                                    onChange={e => setForm({ ...form, isTestMode: e.target.checked })}
                                />
                            </div>

                            <div className="space-y-4">
                                <EnterpriseSectionHeader
                                    title="API Kimlik Bilgileri"
                                    subtitle="Sağlayıcı panelinden aldığınız entegrasyon anahtarları."
                                    icon={<Key className="w-5 h-5 text-slate-600" />}
                                />
                                <EnterpriseInput value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="API Key" label="API KEY PÜBLİK ANAHTAR" />
                                <EnterpriseInput value={form.apiSecret} onChange={e => setForm({ ...form, apiSecret: e.target.value })} placeholder="••••••••••••••••" type="password" label="API SECRET (GİZLİ ANAHTAR)" />
                                <EnterpriseInput value={form.merchantId} onChange={e => setForm({ ...form, merchantId: e.target.value })} placeholder="Merchant ID" label="MERCHANT ID (MAĞAZA NO - GEREKLİYSE)" />
                            </div>

                            <div className="space-y-4">
                                <EnterpriseSectionHeader
                                    title="Trafik Yönlendirmesi"
                                    subtitle="Bu ödeme altyapısı hangi hizmetlerin tahsilatında tetiklenecek?"
                                    icon={<ShieldCheck className="w-5 h-5 text-slate-600" />}
                                />

                                <div className="flex flex-col gap-3">
                                    {['SAAS', 'SMS', 'EINVOICE'].map(typ => (
                                        <label key={typ} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-white transition-colors ${form.supportedTypes.includes(typ) ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                                {typ === 'SAAS' && 'SaaS Platform Planları & Abonelikleri'}
                                                {typ === 'SMS' && 'SMS Hizmet Paketleri Alımları'}
                                                {typ === 'EINVOICE' && 'E-Fatura Mühür Kontörü Yüklemeleri'}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                                checked={form.supportedTypes.includes(typ)}
                                                onChange={() => toggleSupportedType(typ)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                            <EnterpriseButton onClick={() => setModalOpen(false)} variant="secondary">İptal Et</EnterpriseButton>
                            <EnterpriseButton onClick={handleSave} variant="primary">Kimlikleri Teyit Et ve Uygula</EnterpriseButton>
                        </div>
                    </div>
                </div>
            )}
        </EnterprisePageShell>
    );
}
