
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [customer, setCustomer] = useState<any>(null);
    const [statement, setStatement] = useState<any[]>([]);
    const [activeVisit, setActiveVisit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, statRes, visitRes] = await Promise.all([
                    fetch(`/api/customers/${id}`),
                    fetch(`/api/customers/${id}/statement`),
                    fetch('/api/field-sales/visits/active')
                ]);

                if (custRes.ok) {
                    const data = await custRes.json();
                    setCustomer(data.customer || data);
                }

                if (statRes.ok) {
                    const data = await statRes.json();
                    setStatement(data.statement || []);
                }

                if (visitRes.ok) {
                    const data = await visitRes.json();
                    setActiveVisit(data.activeVisit);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleStartVisit = async () => {
        setActionLoading(true);
        const performCheckIn = async (location: any = null) => {
            try {
                const res = await fetch('/api/field-sales/visits/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customerId: id, location })
                });

                if (res.ok) {
                    const data = await res.json();
                    setActiveVisit(data);
                } else {
                    const error = await res.json();
                    alert(error.error || 'Ziyaret başlatılamadı.');
                }
            } catch (e) {
                console.error(e);
                alert('Bağlantı hatası.');
            } finally {
                setActionLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => performCheckIn({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy)
                }),
                (err) => {
                    console.warn(err);
                    performCheckIn(null);
                },
                { timeout: 8000 }
            );
        } else {
            performCheckIn(null);
        }
    };

    if (loading) return <div className="p-8 text-center opacity-50">Yükleniyor...</div>;
    if (!customer) return <div className="p-8 text-center">Müşteri bulunamadı.</div>;

    return (
        <div className="flex flex-col min-h-full bg-[#0f111a]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-b from-[#1e2330] to-[#161b22] border-b border-white/5">
                <button onClick={() => router.back()} className="text-blue-400 font-bold mb-4 flex items-center gap-1">
                    ← Geri
                </button>
                <h1 className="text-3xl font-black mb-2 tracking-tighter uppercase">{customer.name}</h1>
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-black text-gray-500 uppercase mb-1">Cari Bakiye</div>
                        <div className={`text-xl font-black ${Number(customer.balance) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ₺{Number(customer.balance).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Visit Status & Actions */}
                    {activeVisit ? (
                        activeVisit.customer?.id === id ? (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => router.push(`/field-mobile/order/create?visitId=${activeVisit.id}&customerId=${id}&customerName=${customer.name}`)}
                                    className="bg-blue-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20"
                                >
                                    Sipariş Al
                                </button>
                                <button
                                    onClick={() => router.push(`/field-mobile/collection/create?visitId=${activeVisit.id}&customerId=${id}&customerName=${customer.name}`)}
                                    className="bg-green-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-900/20"
                                >
                                    Tahsilat Gir
                                </button>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-[11px] text-red-400 font-bold text-center">
                                Başka bir müşteride ({activeVisit.customer?.name}) aktif ziyaretiniz var. İşlem yapmak için önce o ziyareti sonlandırın.
                            </div>
                        )
                    ) : (
                        <button
                            onClick={handleStartVisit}
                            disabled={actionLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            {actionLoading ? 'İŞLENİYOR...' : '📍 ZİYARETİ BAŞLAT'}
                        </button>
                    )}
                </div>
            </div>

            {/* Account Statement */}
            <div className="p-6">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Hesap Ekstresi</h2>
                <div className="space-y-4">
                    {statement.length > 0 ? (
                        statement.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-[#161b22] rounded-2xl border border-white/5">
                                <div>
                                    <div className="text-xs font-bold text-gray-400 mb-1">{new Date(item.date).toLocaleDateString('tr-TR')}</div>
                                    <div className="text-sm font-bold">{item.description}</div>
                                </div>
                                <div className={`text-sm font-black ${item.direction === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.direction === 'IN' ? '+' : '-'} ₺{item.amount.toLocaleString()}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 opacity-20 italic">Hareket bulunamadı.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
