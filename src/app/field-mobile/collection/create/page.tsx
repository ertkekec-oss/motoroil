
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { fieldDb } from '@/lib/field-db';

export default function MobileCreateCollectionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showError } = useModal();

    const visitId = searchParams.get('visitId');
    const customerId = searchParams.get('customerId');
    const customerName = searchParams.get('customerName');

    const [kasalar, setKasalar] = useState<any[]>([]);
    const [selectedKasa, setSelectedKasa] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Saha Tahsilatı');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKasalar = async () => {
            try {
                const res = await fetch('/api/kasalar');
                if (res.ok) {
                    const data = await res.json();
                    setKasalar(data.kasalar || []);
                    // Default to first 'Nakit' kasa if available
                    const defaultKasa = data.kasalar.find((k: any) => k.type === 'Nakit') || data.kasalar[0];
                    if (defaultKasa) setSelectedKasa(defaultKasa.id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchKasalar();
    }, []);

    const handleSave = async () => {
        if (!amount || Number(amount) <= 0) {
            alert('Lütfen geçerli bir tutar girin.');
            return;
        }
        if (!selectedKasa) {
            alert('Lütfen bir kasa/hesap seçin.');
            return;
        }

        setSaving(true);
        const colData = {
            visitId: visitId || '',
            customerId: customerId || '',
            kasaId: selectedKasa,
            amount: Number(amount),
            description,
            timestamp: Date.now(),
            synced: false
        };

        try {
            // First, try online
            const res = await fetch('/api/field-sales/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(colData)
            });

            if (res.ok) {
                // Success: record as synced in local DB too
                await (fieldDb as any).collections.add({ ...colData, synced: true });
                alert('Tahsilat başarıyla kaydedildi.');
                router.back();
            } else {
                // Server error: save to offline queue
                await (fieldDb as any).collections.add(colData);
                alert('Tahsilat kuyruğa eklendi (Çevrimdışı kaydedilecek).');
                router.back();
            }
        } catch (e) {
            // Network error: save to offline queue
            await (fieldDb as any).collections.add(colData);
            alert('Bağlantı yok. Tahsilat çevrimdışı kaydedildi.');
            router.back();
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Yükleniyor...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#0f111a] text-white">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-[#161b22] flex justify-between items-center">
                <button onClick={() => router.back()} className="text-gray-400">İptal</button>
                <h1 className="font-bold text-sm">Tahsilat: {customerName || 'Müşteri'}</h1>
                <div className="w-10"></div>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Amount Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TAHSİLAT TUTARI (₺)</label>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6 text-4xl font-black text-blue-400 focus:outline-none focus:border-blue-500 text-center"
                        autoFocus
                    />
                </div>

                {/* Kasa Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ÖDEME KANALI / KASA</label>
                    <div className="grid grid-cols-1 gap-2">
                        {kasalar.map(k => (
                            <button
                                key={k.id}
                                onClick={() => setSelectedKasa(k.id)}
                                className={`p-4 rounded-xl border flex justify-between items-center transition-all ${selectedKasa === k.id
                                    ? 'bg-blue-600/20 border-blue-600 ring-1 ring-blue-600'
                                    : 'bg-white/5 border-white/5 opacity-60'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{k.type === 'Banka' ? '🏦' : '💵'}</span>
                                    <div className="text-left leading-tight">
                                        <div className="font-bold text-sm">{k.name}</div>
                                        <div className="text-[10px] opacity-50 uppercase">{k.type}</div>
                                    </div>
                                </div>
                                {selectedKasa === k.id && <span className="text-blue-400">●</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AÇIKLAMA (OPSİYONEL)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 min-h-[80px]"
                    />
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="p-4 bg-[#161b22] border-t border-white/10 safe-area-bottom">
                <button
                    onClick={handleSave}
                    disabled={saving || !amount}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-900/20 transition-all text-sm tracking-widest"
                >
                    {saving ? 'KAYDEDİLİYOR...' : 'TAHSİLATI TAMAMLA'}
                </button>
            </div>
        </div>
    );
}
