
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileVisitsPage() {
    const router = useRouter();
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                const res = await fetch('/api/field-sales/visits');
                if (res.ok) {
                    const data = await res.json();
                    setVisits(data.visits || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVisits();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="p-4 space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-white px-2">Ziyaret Geçmişi</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] px-2 mt-1">Tamamlanan Görüşmeler</p>
            </div>

            <div className="space-y-3">
                {visits.length === 0 ? (
                    <div className="text-center py-20 opacity-30 text-sm">Henüz ziyaret bulunmuyor.</div>
                ) : (
                    visits.map((visit) => (
                        <div key={visit.id} className="bg-[#161b22] border border-white/5 p-4 rounded-2xl">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-white">{visit.customer?.name}</div>
                                <div className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">
                                    {new Date(visit.checkInTime).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 mb-3 flex gap-4">
                                <span>🕒 {new Date(visit.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                                {visit.orders?.length > 0 && <span className="text-blue-400 font-bold">🛒 {visit.orders.length} Sipariş</span>}
                            </div>
                            {visit.notes && <div className="text-[11px] bg-black/20 p-2 rounded italic text-gray-500">{visit.notes}</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
