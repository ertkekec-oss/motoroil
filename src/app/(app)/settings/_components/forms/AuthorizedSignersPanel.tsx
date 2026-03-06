"use client";
import React, { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm ${props.className || ''}`}
        />
    );
}

function ERPField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}

const CATEGORY_LABELS: Record<string, string> = {
    CONTRACT: 'Sözleşme',
    AGREEMENT: 'Anlaşma',
    RECONCILIATION: 'Mutabakat',
    COMPANY_DOCUMENT: 'Firma Belgesi',
    EMPLOYEE_DOCUMENT: 'Personel Belgesi',
    FORM: 'Form',
    OTHER: 'Diğer'
};

export default function AuthorizedSignersPanel() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [signers, setSigners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', title: '', email: '', phone: '', isActive: true, defaultSigner: false, allowedCategories: [] as string[]
    });

    const fetchSigners = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/authorized-signers');
            const data = await res.json();
            if (data.success) {
                setSigners(data.signers || []);
            } else {
                showError('Hata', data.error || 'Veri çekilemedi.');
            }
        } catch (error) {
            showError('Hata', 'Sunucuya ulaşılamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSigners();
    }, []);

    const handleOpenCreate = () => {
        setFormData({ name: '', title: '', email: '', phone: '', isActive: true, defaultSigner: false, allowedCategories: [] });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (signer: any) => {
        setFormData({
            name: signer.name || '',
            title: signer.title || '',
            email: signer.email || '',
            phone: signer.phone || '',
            isActive: signer.isActive,
            defaultSigner: signer.defaultSigner,
            allowedCategories: signer.allowedCategories || []
        });
        setEditingId(signer.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        showConfirm('Yetkiliyi Sil', 'Bu imza yetkilisini silmek istediğinize emin misiniz? Kaydedilen mevcut imzalar etkilenmez.', async () => {
            try {
                const res = await fetch(`/api/authorized-signers/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Geri bildirim başarıyla uygulandı.');
                    fetchSigners();
                } else {
                    showError('Hata', data.error);
                }
            } catch (err) {
                showError('Hata', 'İşlem başarısız.');
            }
        });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.email) {
            showError('Uyarı', 'Lütfen ad-soyad ve geçerli bir e-posta girin.');
            return;
        }

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `/api/authorized-signers/${editingId}` : '/api/authorized-signers';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', editingId ? 'Yetkili güncellendi.' : 'Yeni yetkili eklendi.');
                setIsModalOpen(false);
                fetchSigners();
            } else {
                showError('Hata', data.error);
            }
        } catch (error) {
            showError('Hata', 'İşlem başarısız.');
        }
    };

    const toggleCategory = (cat: string) => {
        setFormData(prev => {
            const current = [...prev.allowedCategories];
            if (current.includes(cat)) return { ...prev, allowedCategories: current.filter(c => c !== cat) };
            return { ...prev, allowedCategories: [...current, cat] };
        });
    };

    return (
        <div className="max-w-5xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Yetkili İmzacı Yönetimi</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Sözleşme ve mutabakat işlemlerinde kullanılacak resmi imza yetkililerinizi buradan tanımlayın.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="h-10 px-5 bg-slate-900 dark:bg-white border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 flex items-center gap-2"
                >
                    + Yeni Yetkili Ekle
                </button>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Yetkili</th>
                            <th className="px-6 py-4">İletişim</th>
                            <th className="px-6 py-4">Rol / İzin</th>
                            <th className="px-6 py-4">Durum</th>
                            <th className="px-6 py-4 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[14px]">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                        ) : signers.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Henüz imza yetkilisi tanımlanmamış.</td></tr>
                        ) : signers.map(signer => (
                            <tr key={signer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900 dark:text-white">{signer.name}</div>
                                    <div className="text-[12px] text-slate-500">{signer.title || '-'}</div>
                                    {signer.defaultSigner && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 mt-1">VARSAYILAN</span>}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    <div className="truncate">{signer.email}</div>
                                    <div className="text-[12px] text-slate-500">{signer.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {signer.allowedCategories?.length ? signer.allowedCategories.map((c: string) => (
                                            <span key={c} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] border border-slate-200 dark:border-slate-700">
                                                {CATEGORY_LABELS[c] || c}
                                            </span>
                                        )) : <span className="text-[12px] text-slate-400">İzin yok</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {signer.isActive ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[12px] font-bold border border-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20">Aktif</span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-50 text-slate-500 text-[12px] font-bold border border-slate-200">Pasif</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleOpenEdit(signer)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Düzenle</button>
                                    <button onClick={() => handleDelete(signer.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Sil</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">{editingId ? 'Yetkili Düzenle' : 'Yeni Yetkili Ekle'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <ERPField label="Ad Soyad (*)">
                                    <ERPInput value={formData.name} onChange={(e: any) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Ahmet Yılmaz" />
                                </ERPField>
                                <ERPField label="Ünvan">
                                    <ERPInput value={formData.title} onChange={(e: any) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Örn: Genel Müdür" />
                                </ERPField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <ERPField label="E-Posta (*)">
                                    <ERPInput type="email" value={formData.email} onChange={(e: any) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="Yetkili posta adresi" />
                                </ERPField>
                                <ERPField label="Cep Telefonu (OTP için)">
                                    <ERPInput type="tel" value={formData.phone} onChange={(e: any) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+905..." />
                                </ERPField>
                            </div>

                            <ERPField label="Yetki Kategorileri">
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer p-2 border border-slate-100 dark:border-white/5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <input type="checkbox" className="rounded text-slate-900 focus:ring-slate-900"
                                                checked={formData.allowedCategories.includes(key)}
                                                onChange={() => toggleCategory(key)} />
                                            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </ERPField>

                            <div className="flex gap-6 pt-2 border-t border-slate-100 dark:border-white/5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded text-slate-900 focus:ring-slate-900"
                                        checked={formData.isActive} onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))} />
                                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Aktif</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded text-slate-900 focus:ring-slate-900"
                                        checked={formData.defaultSigner} onChange={e => setFormData(p => ({ ...p, defaultSigner: e.target.checked }))} />
                                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Varsayılan İmzacı Yap</span>
                                </label>
                            </div>

                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 rounded-lg transition-colors">Vazgeç</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[14px] font-medium rounded-lg hover:bg-slate-800 transition-colors">
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
