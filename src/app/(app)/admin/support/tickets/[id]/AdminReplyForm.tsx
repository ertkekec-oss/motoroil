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

    const cannedResponses = [
        { title: 'Selamlama', body: 'Merhaba,\n\nTalebiniz bize ulaştı. Konuyu ilgili birime aktardım, en kısa sürede dönüş yapacağız.\n\nSaygılarımızla,\nPeriodya Destek Ekibi' },
        { title: 'Çözüm Onayı', body: 'Merhaba,\n\nİlettiğiniz sorun çözümlenmiştir. Kontrol edip onay verebilir misiniz?\n\nKeyifli çalışmalar dileriz.' },
        { title: 'Daha Fazla Bilgi', body: 'Merhaba,\n\nKonuyu detaylı inceleyebilmemiz için ekran görüntüsü veya işlem yaptığınız sayfanın URL bilgisini iletebilir misiniz?' },
    ];

    return (
        <form onSubmit={handleSubmit} className={`bg-white border p-6 rounded-2xl shadow-sm flex flex-col gap-4 ${isInternal ? 'border-amber-500/50 bg-amber-50/10' : 'border-slate-200'}`}>
            {error && <div className="text-red-400 text-xs font-medium px-4">{error}</div>}

            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer uppercase tracking-widest">
                        <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded border-slate-300 bg-slate-50 text-amber-500 focus:ring-amber-500 w-4 h-4"
                        />
                        <span className={isInternal ? 'text-amber-600' : ''}>
                            🟡 İç Not (Internal)
                        </span>
                    </label>
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-3 py-1.5 rounded-lg outline-none max-w-[150px] font-bold"
                        onChange={(e) => {
                            const found = cannedResponses.find(r => r.title === e.target.value);
                            if (found) setBody(found.body);
                        }}
                    >
                        <option value="">Hazır Yanıtlar...</option>
                        {cannedResponses?.map(r => <option key={r.title} value={r.title}>{r.title}</option>)}
                    </select>
                    {!isInternal && (
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] px-3 py-1.5 rounded-lg outline-none font-bold"
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
            </div>

            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={isInternal ? "Ekip için iç notunuzu yazın. Müşteri görmeyecek..." : "Müşteriye yanıtınızı buraya yazın..."}
                rows={5}
                required
                className={`w-full bg-slate-50 border p-4 rounded-xl text-slate-900 text-sm outline-none transition-colors placeholder:text-slate-400 resize-y ${isInternal ? 'border-amber-500/30 focus:border-amber-500/60 bg-amber-50/50' : 'border-slate-200 focus:border-orange-500/50'}`}
            />
            <div className="flex justify-end items-center">
                <button
                    type="submit"
                    disabled={loading || !body.trim()}
                    className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 ${isInternal ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20' : 'bg-orange-600 hover:bg-orange-500 '}`}
                >
                    {loading ? 'Gönderiliyor...' : isInternal ? 'İç Not Ekle' : 'Müşteriye Gönder'}
                </button>
            </div>
        </form>
    );
}
