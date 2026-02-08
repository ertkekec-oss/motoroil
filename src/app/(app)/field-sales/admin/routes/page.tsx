
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminRoutesPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New Route Form
    const [newRouteName, setNewRouteName] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        fetchData();
    }, [isLoading, isAuthenticated, router]);

    const fetchData = async () => {
        try {
            const [routesRes, staffRes] = await Promise.all([
                fetch('/api/field-sales/routes'),
                fetch('/api/staff') // Assuming this endpoint exists or I need to create it
            ]);

            if (routesRes.ok) {
                const data = await routesRes.json();
                setRoutes(data);
            }
            if (staffRes.ok) {
                const data = await staffRes.json();
                setStaffList(Array.isArray(data) ? data : (data.staff || []));
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const sendWhatsApp = (staff: any) => {
        if (!staff?.phone) {
            alert('Bu personelin telefon numarası sistemde kayıtlı değil. Lütfen personel yönetiminden ekleyin.');
            return;
        }

        const origin = window.location.origin;
        const message = `Merhaba ${staff.name}, saha satış sistemine şu adresten giriş yapabilirsin: ${origin}/field-mobile/routes`;
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${staff.phone}?text=${encodedMessage}`;
        window.open(url, '_blank');
    };

    const handleCreateRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/field-sales/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newRouteName,
                    staffId: selectedStaffId,
                    date: routeDate
                })
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewRouteName('');
                fetchData(); // Refresh list
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Rota oluşturulamadı.');
            }
        } catch (error) {
            console.error("Create route error", error);
        }
    };

    if (loading) return <div className="p-8 text-white">Yükleniyor...</div>;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#0f111a] text-white font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Saha Satış Yönetimi</h1>
                    <p className="text-sm text-gray-400">Rota planlama ve ekip takibi.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    <span className="text-xl">+</span> YENİ ROTA OLUŞTUR
                </button>
            </div>

            {/* Routes Grid */}
            <div className="grid gap-4">
                {routes.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                        <div className="text-4xl mb-4 opacity-30">🗺️</div>
                        <div className="font-bold text-lg opacity-50">Henüz planlanmış bir rota yok.</div>
                        <div className="text-sm opacity-30 mt-2">İlk rotanızı oluşturarak başlayın.</div>
                    </div>
                ) : (
                    routes.map((route: any) => (
                        <div key={route.id} className="bg-[#161b22] border border-white/5 p-6 rounded-2xl hover:border-blue-500/30 transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${route.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
                                        route.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-500'
                                        }`}></div>
                                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{route.name}</h3>
                                    <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest opacity-50">{route.status}</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span>👤</span> {route.staff?.name || 'Atanmadı'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>📅</span> {new Date(route.date).toLocaleDateString('tr-TR')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>📍</span> {route._count?.stops || 0} Durak
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => router.push(`/field-sales/admin/routes/${route.id}`)}
                                    className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                                >
                                    DURAKLARI YÖNET
                                </button>
                                <button
                                    onClick={() => sendWhatsApp(route.staff)}
                                    className="bg-green-600/10 hover:bg-green-600/20 text-green-500 p-2 rounded-lg transition-colors"
                                    title="WhatsApp ile Giriş Bilgisi Gönder"
                                >
                                    <span className="text-xl">💬</span>
                                </button>
                                <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors" title="Sil">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Yeni Rota Planla</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white transition-colors text-2xl">×</button>
                        </div>

                        <form onSubmit={handleCreateRoute} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Rota Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={newRouteName}
                                    onChange={(e) => setNewRouteName(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Örn: Pazartesi - Avrupa Yakası"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tarih</label>
                                    <input
                                        type="date"
                                        required
                                        value={routeDate}
                                        onChange={(e) => setRouteDate(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Personel Seçimi</label>
                                    <select
                                        required
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none appearance-none"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {staffList.map((staff: any) => (
                                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    VAZGEÇ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    OLUŞTUR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
