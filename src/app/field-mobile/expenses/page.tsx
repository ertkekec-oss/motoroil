
"use client";

import { useEffect, useState } from 'react';

export default function MobileExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [type, setType] = useState('Benzin');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/staff/expenses');
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.expenses || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/staff/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, amount, description })
            });
            if (res.ok) {
                setShowModal(false);
                setAmount('');
                setDescription('');
                fetchExpenses();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-[#0f111a] p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-black">Masraflarım</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-blue-900/40"
                >
                    +
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 opacity-50">Yükleniyor...</div>
                ) : expenses.length > 0 ? (
                    expenses.map((e) => (
                        <div key={e.id} className="bg-[#161b22] border border-white/5 p-4 rounded-3xl flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                                    {new Date(e.date).toLocaleDateString('tr-TR')} • {e.type}
                                </div>
                                <div className="text-sm font-bold">{e.description || e.type}</div>
                                <div className={`text-[9px] font-black uppercase mt-1 ${e.status === 'Onaylandı' ? 'text-green-500' :
                                        e.status === 'Reddedildi' ? 'text-red-500' : 'text-orange-500'
                                    }`}>
                                    ● {e.status}
                                </div>
                            </div>
                            <div className="text-lg font-black italic">₺{Number(e.amount).toLocaleString()}</div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 opacity-20 italic">Henüz masraf girişi yapılmadı.</div>
                )}
            </div>

            {/* Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#161b22] w-full max-w-md rounded-[3rem] p-10 border border-white/10 relative">
                        <h2 className="text-2xl font-black mb-8 text-center tracking-tighter uppercase">Yeni Masraf Kaydı</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Masraf Tipi</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none appearance-none"
                                >
                                    <option value="Benzin">⛽ Benzin / Yakıt</option>
                                    <option value="Yemek">🍔 Yemek / Temsil</option>
                                    <option value="Konaklama">🏨 Konaklama</option>
                                    <option value="OgsHgs">🛣️ OGS / HGS / Otopark</option>
                                    <option value="Diger">📦 Diğer</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Tutar (TL)</label>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-black focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Açıklama / Not</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Opsiyonel açıklama..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-blue-500 outline-none h-24 resize-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-white/5 rounded-2xl font-bold text-sm uppercase"
                                >
                                    İptal
                                </button>
                                <button
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-sm uppercase shadow-xl shadow-blue-900/40"
                                >
                                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
