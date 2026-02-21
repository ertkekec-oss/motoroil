
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function MobileRouteDetailPage() {
    const { showError, showConfirm } = useModal();
    const router = useRouter();
    const params = useParams();
    const routeId = params.id as string;

    const [route, setRoute] = useState<any>(null);
    const [stops, setStops] = useState<any[]>([]);
    const [activeVisit, setActiveVisit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutNotes, setCheckoutNotes] = useState('');

    useEffect(() => {
        fetchData();
    }, [routeId]);

    const fetchData = async () => {
        try {
            const [routeRes, visitRes] = await Promise.all([
                fetch(`/api/field-sales/routes/${routeId}`),
                fetch('/api/field-sales/visits/active')
            ]);

            if (routeRes.ok) {
                const data = await routeRes.json();
                setRoute(data);
                setStops(data.stops || []);
            }
            if (visitRes.ok) {
                const data = await visitRes.json();
                setActiveVisit(data.activeVisit);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (stopId: string, customerId: string) => {
        showConfirm('Giriş Yap', 'Ziyareti başlatmak istiyor musunuz?', async () => {
            setActionLoading(true);

            const performCheckIn = async (location: any = null) => {
                try {
                    const res = await fetch('/api/field-sales/visits/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ routeStopId: stopId, customerId, location })
                    });

                    if (res.ok) {
                        fetchData(); // Refresh active visit
                    } else {
                        const err = await res.json();
                        showError('Hata', err.error || 'Check-in başarısız.');
                    }
                } catch (e) {
                    console.error(e);
                    showError('Hata', 'Bağlantı hatası.');
                } finally {
                    setActionLoading(false);
                }
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => performCheckIn({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    (err) => {
                        console.warn("Geolocation warning:", err.message);
                        performCheckIn(null); // Fallback
                    },
                    { timeout: 5000 }
                );
            } else {
                performCheckIn(null);
            }
        });
    };

    const handleCheckOut = async () => {
        if (!activeVisit) return;

        const visitId = activeVisit.id;
        setActionLoading(true);

        const performCheckOut = async (location: any = null) => {
            try {
                const res = await fetch('/api/field-sales/visits/end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visitId,
                        location,
                        notes: checkoutNotes,
                        photos: []
                    })
                });

                if (res.ok) {
                    setShowCheckoutModal(false);
                    setCheckoutNotes('');
                    fetchData(); // Refresh stops status
                } else {
                    showError('Hata', 'Check-out başarısız.');
                }
            } catch (e) {
                console.error(e);
                showError('Hata', 'Bağlantı hatası.');
            } finally {
                setActionLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => performCheckOut({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    console.warn("Geolocation warning:", err.message);
                    performCheckOut(null); // Fallback
                },
                { timeout: 5000 }
            );
        } else {
            performCheckOut(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Yükleniyor...</div>;
    if (!route) return <div className="p-8 text-center text-white">Rota bulunamadı.</div>;

    return (
        <div className="p-4 pb-24 min-h-screen bg-[#0f111a] text-white">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="text-2xl">←</button>
                <div>
                    <h1 className="text-lg font-bold">{route.name}</h1>
                    <div className="text-xs text-gray-400">{new Date(route.date).toLocaleDateString('tr-TR')}</div>
                </div>
                <div className="ml-auto">
                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${route.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>{route.status}</div>
                </div>
            </div>

            {/* Active Visit Alert */}
            {activeVisit && (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl mb-6 animate-pulse">
                    <div className="text-xs font-bold text-green-400 uppercase mb-1">ŞU AN ZİYARETTESİNİZ</div>
                    <div className="font-bold text-lg">{activeVisit.customer?.name}</div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <button
                            onClick={() => router.push(`/field-mobile/order/create?visitId=${activeVisit.id}&customerId=${activeVisit.customer?.id}&customerName=${activeVisit.customer?.name}`)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span>🛒</span> SİPARİŞ
                        </button>
                        <button
                            onClick={() => router.push(`/field-mobile/collection/create?visitId=${activeVisit.id}&customerId=${activeVisit.customer?.id}&customerName=${activeVisit.customer?.name}`)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span>💰</span> TAHSİLAT
                        </button>
                    </div>

                    <button
                        onClick={() => setShowCheckoutModal(true)}
                        disabled={actionLoading}
                        className="mt-3 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-900/20 transition-all"
                    >
                        {actionLoading ? 'İşleniyor...' : 'ZİYARETİ BİTİR (CHECK-OUT)'}
                    </button>
                </div>
            )}

            {/* Checkout Form Modal (Simple Overlay) */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-end animate-in fade-in duration-200">
                    <div className="w-full bg-[#161b22] rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-lg text-white">Ziyareti Sonlandır</h2>
                            <button onClick={() => setShowCheckoutModal(false)} className="text-gray-400">✖</button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">GÖRÜŞME NOTLARI</label>
                            <textarea
                                value={checkoutNotes}
                                onChange={(e) => setCheckoutNotes(e.target.value)}
                                placeholder="Görüşme nasıl geçti? Önemli notlar..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-green-500 min-h-[120px]"
                            />
                        </div>
                        <button
                            onClick={handleCheckOut}
                            disabled={actionLoading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            {actionLoading ? 'KAYDEDİLİYOR...' : 'ZİYARETİ TAMAMLA'}
                        </button>
                    </div>
                </div>
            )}

            {/* Stops List */}
            <div className="space-y-4">
                {stops.length === 0 ? (
                    <div className="text-center opacity-50 py-10">Durak yok.</div>
                ) : (
                    stops.map((stop: any, index: number) => {
                        const isCurrentVisit = activeVisit?.stop?.id === stop.id;
                        const isVisited = stop.status === 'VISITED';
                        const canCheckIn = !activeVisit && !isVisited;

                        return (
                            <div key={stop.id} className={`bg-[#161b22] border rounded-xl p-4 transition-all ${isCurrentVisit ? 'border-green-500 ring-1 ring-green-500/50' : 'border-white/5'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-black/30 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-gray-400">
                                        {index + 1}
                                    </div>
                                    {isVisited && <span className="text-green-500 text-xl">✅</span>}
                                </div>
                                <div className="font-bold text-lg mb-1">{stop.customer?.name}</div>
                                <div className="text-xs text-gray-400 mb-4 flex justify-between items-center">
                                    <span>{stop.customer?.district || '-'}, {stop.customer?.city || '-'}</span>
                                    {stop.customer?.address && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const addr = encodeURIComponent(`${stop.customer.address} ${stop.customer.district || ''} ${stop.customer.city || ''}`);
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, '_blank');
                                            }}
                                            className="text-blue-400 font-bold bg-blue-400/10 px-2 py-1 rounded text-[10px] hover:bg-blue-400/20 transition-all"
                                        >
                                            🗺️ YOL TARİFİ
                                        </button>
                                    )}
                                </div>

                                {!isVisited && !isCurrentVisit && (
                                    <button
                                        onClick={() => handleCheckIn(stop.id, stop.customer.id)}
                                        disabled={!!activeVisit || actionLoading}
                                        className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${!!activeVisit
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                            }`}
                                    >
                                        {!!activeVisit ? 'BAŞKA ZİYARET AKTİF' : 'ZİYARETİ BAŞLAT'}
                                    </button>
                                )}

                                {isCurrentVisit && (
                                    <div className="text-center text-xs text-green-400 font-bold animate-pulse">
                                        ZİYARET DEVAM EDİYOR
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
