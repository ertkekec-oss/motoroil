"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function NewTicketPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topicId = searchParams.get('topicId'); // Pre-fill related topic if coming from help page

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        subject: '',
        category: 'GENERAL',
        priority: 'P3_NORMAL',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const browserInfo = typeof window !== 'undefined' ? navigator.userAgent : 'Unknown';
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    relatedHelpTopicId: topicId,
                    metadata: {
                        userAgent: browserInfo,
                        url: window.location.href,
                        resolution: `${window.innerWidth}x${window.innerHeight}`
                    }
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'İşlem başarısız');
            }

            const { ticket } = await res.json();
            router.push(`/support/${ticket.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto font-sans">
            <div className="mb-6">
                <Link href="/support" className="text-orange-500 hover:underline flex items-center gap-1 text-sm font-medium mb-4">
                    ← Taleplerime Dön
                </Link>
                <h1 className="text-3xl font-black text-white">Yeni Destek Talebi</h1>
                <p className="text-gray-400 text-sm mt-1">Sorununuzu detaylı bir şekilde açıklayın, size en kısa sürede dönüş yapacağız.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-[#0f111a] border border-white/5 p-6 md:p-8 rounded-3xl shadow-xl shadow-black/50 space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-start gap-2">
                        <span className="mt-0.5">⚠️</span> <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kategori</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-orange-500/50 transition-colors"
                        >
                            <option value="GENERAL">Genel Soru</option>
                            <option value="BILLING">Fatura & Ödeme</option>
                            <option value="TECHNICAL">Teknik Destek</option>
                            <option value="FEATURE_REQUEST">Yeni Özellik İsteği</option>
                            <option value="BUG">Hata Bildirimi</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Öncelik</label>
                        <select
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-orange-500/50 transition-colors"
                        >
                            <option value="P1_URGENT">Acil (Çalışmayı Engelleyen Hata)</option>
                            <option value="P2_HIGH">Yüksek</option>
                            <option value="P3_NORMAL">Normal</option>
                            <option value="P4_LOW">Düşük</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Konu Başlığı</label>
                    <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Örn: E-Fatura gönderiminde 404 hatası alıyorum"
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-orange-500/50 transition-colors placeholder:text-gray-600"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Açıklama (Detaylar)</label>
                    <p className="text-xs text-gray-500 mb-2">Hatanın nasıl oluştuğu, adımlar, aldığınız ekran uyarıları vb. tüm detayları yazın.</p>
                    <textarea
                        required
                        rows={8}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Karşılaştığınız sorunu lütfen adım adım açıklayın..."
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-orange-500/50 transition-colors placeholder:text-gray-600 resize-y"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Gönderiliyor...' : 'Talebi Gönder →'}
                    </button>
                </div>
            </form>
        </div>
    );
}
