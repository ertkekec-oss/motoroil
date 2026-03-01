"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function VariantsPage() {
    const [attributes, setAttributes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showSuccess, showError } = useModal();

    const [newName, setNewName] = useState('');
    const [newValues, setNewValues] = useState('');

    useEffect(() => {
        fetchAttributes();
    }, []);

    const fetchAttributes = async () => {
        try {
            const res = await fetch('/api/products/attributes');
            const data = await res.json();
            if (data.success) setAttributes(data.attributes);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAttribute = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/products/attributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    values: newValues.split(',').map(v => v.trim()).filter(v => v)
                })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Özellik tanımı eklendi.');
                setNewName('');
                setNewValues('');
                fetchAttributes();
            } else {
                showError('Hata', data.error);
            }
        } catch (err) {
            showError('Hata', 'İşlem başarısız.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 border-b border-slate-200 dark:border-white/10 pb-5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="text-2xl">🛠️</span> Varyant Özellik Tanımları
                </h1>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Ürünlerinizi kategorize etmek ve detaylandırmak için varyant özelliklerini ve seçeneklerini yönetin.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sol: Yeni Ekle */}
                <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm p-6 h-fit">
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-5 pb-3 border-b border-slate-100 dark:border-white/5">
                        Yeni Özellik Ekle
                    </h3>
                    <div className="space-y-5">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                Özellik Adı
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
                                placeholder="Örn: Renk, Beden, Litre"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                                Seçenekler <span className="text-slate-400 lowercase normal-case">(Virgülle Ayırın)</span>
                            </label>
                            <textarea
                                className="w-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[12px] p-3 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm h-32 resize-none custom-scroll"
                                placeholder="Örn: Mavi, Kırmızı, Yeşil..."
                                value={newValues}
                                onChange={e => setNewValues(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleAddAttribute}
                            disabled={isSaving}
                            className="w-full py-3 rounded-[12px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-all shadow-sm"
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Tanımı Kaydet'}
                        </button>
                    </div>
                </div>

                {/* Sağ: Mevcutlar */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Mevcut Özellikler
                    </h3>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-32 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                            Yükleniyor...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {attributes.map(attr => (
                                <div key={attr.id} className="bg-white dark:bg-[#0f172a] rounded-[20px] p-5 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{attr.name}</h4>
                                        <button className="text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {attr.values.map((v: any) => (
                                            <span key={v.id} className="px-3 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-full text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                {v.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {attributes.length === 0 && (
                                <div className="col-span-1 md:col-span-2 p-8 text-center text-slate-500 dark:text-slate-400 text-[13px] font-semibold rounded-[20px] border border-dashed border-slate-300 dark:border-white/10">
                                    Henüz özellik tanımı bulunmuyor. Sol panelden yeni özellik ekleyebilirsiniz.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
