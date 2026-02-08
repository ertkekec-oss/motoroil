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
        <div className="p-8">
            <h1 className="text-3xl font-black mb-8">🛠️ Varyant Özellik Tanımları</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sol: Yeni Ekle */}
                <div className="card glass p-6 h-fit">
                    <h3 className="text-xl font-bold mb-4">Yeni Özellik Ekle</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Özellik Adı</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-primary"
                                placeholder="Örn: Renk, Beden, Litre"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted uppercase mb-1 block">Seçenekler (Virgülle Ayırın)</label>
                            <textarea
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-primary h-32"
                                placeholder="Örn: Mavi, Kırmızı, Yeşil..."
                                value={newValues}
                                onChange={e => setNewValues(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleAddAttribute}
                            disabled={isSaving}
                            className="w-full btn btn-primary py-3 font-bold"
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Tanımı Kaydet'}
                        </button>
                    </div>
                </div>

                {/* Sağ: Mevcutlar */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold mb-4">Mevcut Özellikler</h3>
                    {isLoading ? <p>Yükleniyor...</p> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {attributes.map(attr => (
                                <div key={attr.id} className="card glass p-5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="text-lg font-black text-primary">{attr.name}</h4>
                                        <button className="text-white/20 hover:text-red-400">🗑️</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {attr.values.map((v: any) => (
                                            <span key={v.id} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/70">
                                                {v.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
