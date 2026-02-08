
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';

export default function AdminRouteDetailPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const routeId = params.id as string;

    const [route, setRoute] = useState<any>(null);
    const [stops, setStops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerLoading, setCustomerLoading] = useState(false);

    // Create Stop UI
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        if (routeId) fetchData();
    }, [isLoading, isAuthenticated, router, routeId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/field-sales/routes/${routeId}`);
            if (res.ok) {
                const data = await res.json();
                setRoute(data);
                setStops(data.stops || []);
            } else {
                router.push('/field-sales/admin/routes');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        if (customers.length > 0) return;
        setCustomerLoading(true);
        try {
            const res = await fetch('/api/customers?limit=100'); // Assuming basic list endpoint
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCustomerLoading(false);
        }
    };

    const handleAddStop = async () => {
        if (!selectedCustomerId) return;

        try {
            const res = await fetch(`/api/field-sales/routes/${routeId}/stops`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: selectedCustomerId })
            });

            if (res.ok) {
                await fetchData();
                setShowAddModal(false);
                setSelectedCustomerId('');
                setSearchTerm('');
            } else {
                alert('Durak eklenemedi.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteStop = async (stopId: string) => {
        if (!confirm('Bu durağı rotadan kaldırmak istiyor musunuz?')) return;

        try {
            const res = await fetch(`/api/field-sales/stops/${stopId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setStops(prev => prev.filter(s => s.id !== stopId));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-white">Yükleniyor...</div>;
    if (!route) return null;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#0f111a] text-white font-sans">

            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                <div>
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-white mb-2 text-sm font-bold">← ROTA LİSTESİ</button>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">{route.name}</h1>
                    <div className="flex gap-4 text-sm text-gray-400">
                        <div className="bg-white/5 px-3 py-1 rounded-lg">👤 {route.staff?.name}</div>
                        <div className="bg-white/5 px-3 py-1 rounded-lg">📅 {new Date(route.date).toLocaleDateString('tr-TR')}</div>
                        <div className={`px-3 py-1 rounded-lg font-bold ${route.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>{route.status}</div>
                    </div>
                </div>
                <button
                    onClick={() => { setShowAddModal(true); fetchCustomers(); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    <span className="text-xl">+</span> DURAK EKLE
                </button>
            </div>

            {/* Stops Timeline */}
            <div className="relative pl-8">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-white/10"></div>

                {stops.length === 0 ? (
                    <div className="text-gray-500 italic p-4 border border-dashed border-white/10 rounded-xl">
                        Bu rotaya henüz durak eklenmemiş.
                    </div>
                ) : (
                    stops.map((stop: any, index: number) => (
                        <div key={stop.id} className="mb-6 relative group">
                            {/* Dot */}
                            <div className={`absolute -left-[27px] top-4 w-4 h-4 rounded-full border-2 border-[#0f111a] z-10 ${stop.status === 'VISITED' ? 'bg-green-500' : 'bg-blue-500'
                                }`}></div>

                            {/* Card */}
                            <div className="bg-[#161b22] border border-white/5 p-4 rounded-xl hover:border-blue-500/30 transition-all flex justify-between items-center group-hover:translate-x-1 duration-200">
                                <div>
                                    <div className="text-[10px] font-bold opacity-50 mb-1">DURAK #{index + 1}</div>
                                    <div className="font-bold text-lg">{stop.customer?.name}</div>
                                    <div className="text-sm opacity-50 flex gap-2">
                                        <span>📍 {stop.customer?.district || '-'}, {stop.customer?.city || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${stop.status === 'VISITED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {stop.status === 'PENDING' ? 'BEKLİYOR' : stop.status}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteStop(stop.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 text-red-500/50 hover:text-red-500 transition-colors"
                                        title="Kaldır"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Stop Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg h-[80vh] flex flex-col rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#161b22]">
                            <h2 className="text-xl font-bold">Müşteri Ekle</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors text-2xl">×</button>
                        </div>

                        <div className="p-4 border-b border-white/10" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="text"
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                                placeholder="Müşteri ara..."
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {customerLoading ? (
                                <div className="text-center p-4 text-gray-500">Yükleniyor...</div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="text-center p-4 text-gray-500">Müşteri bulunamadı.</div>
                            ) : (
                                filteredCustomers.map((c: any) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCustomerId(c.id)}
                                        className={`w-full text-left p-4 rounded-xl transition-all border ${selectedCustomerId === c.id
                                                ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                                                : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'
                                            }`}
                                    >
                                        <div className="font-bold">{c.name}</div>
                                        <div className="text-xs opacity-50">{c.district}, {c.city}</div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-[#161b22] rounded-b-2xl">
                            <button
                                onClick={handleAddStop}
                                disabled={!selectedCustomerId}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                            >
                                ROTAYA EKLE
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
