"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReplyForm({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
    const [body, setBody] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [statusChange, setStatusChange] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, isInternal, statusChange })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Mesaj gönderilemedi');
            }

            setBody('');
            setIsInternal(false);
            setStatusChange('');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`bg-[#0f111a] border p-4 rounded-2xl shadow-xl flex flex-col gap-4 ${isInternal ? 'border-yellow-500/50' : 'border-white/5'}`}>
            {error && <div className="text-red-400 text-xs font-medium px-4">{error}</div>}
            <div className="flex items-center gap-4 px-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-600 bg-white/5 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className={isInternal ? 'text-yellow-500' : ''}>
                        🟡 Müşteriden Gizle (İç Not / Internal)
                    </span>
                </label>
                {!isInternal && (
                    <select
                        className="bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg outline-none"
                        value={statusChange}
                        onChange={(e) => setStatusChange(e.target.value)}
                    >
                        <option value="">Durumu Değiştirme</option>
                        <option value="WAITING_CUSTOMER">Cevap Bekleniyor Yap</option>
                        <option value="IN_PROGRESS">İşlemde Yap</option>
                        <option value="RESOLVED">Çözüldü Yap</option>
                        <option value="CLOSED">Kapat</option>
                    </select>
                )}
            </div>
            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={isInternal ? "Ekip için iç notunuzu yazın. Müşteri görmeyecek..." : "Müşteriye yanıtınızı buraya yazın..."}
                rows={5}
                required
                className={`w-full bg-white/5 border p-4 rounded-xl text-white text-sm outline-none transition-colors placeholder:text-gray-600 resize-y ${isInternal ? 'border-yellow-500/30 focus:border-yellow-500/60 bg-yellow-500/5' : 'border-white/10 focus:border-orange-500/50'}`}
            />
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !body.trim()}
                    className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 ${isInternal ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}`}
                >
                    {loading ? 'Gönderiliyor...' : isInternal ? 'İç Not Ekle' : 'Müşteriye Gönder'}
                </button>
            </div>
        </form>
    );
}
