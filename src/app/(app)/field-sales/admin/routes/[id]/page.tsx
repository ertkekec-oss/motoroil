
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

const STATUS_OPTIONS = [
    { value: 'PENDING', label: '⏳ Bekliyor', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { value: 'ACTIVE', label: '🟢 Aktif', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { value: 'COMPLETED', label: '✅ Tamamlandı', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { value: 'CANCELLED', label: '❌ İptal', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
];

export default function AdminRouteDetailPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const router = useRouter();
    const params = useParams();
    const routeId = params.id as string;

    const [route, setRoute] = useState<any>(null);
    const [stops, setStops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Durak ekleme
    const [showAddModal, setShowAddModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    // Rota düzenleme
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', date: '', status: '' });

    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.push('/login'); return; }
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
            const res = await fetch('/api/customers?limit=200');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || data || []);
            }
        } catch (e) { console.error(e); }
        finally { setCustomerLoading(false); }
    };

    const handleAddStop = async () => {
        if (!selectedCustomerId) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/field-sales/routes/${routeId}/stops`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: selectedCustomerId, sequence: stops.length + 1 })
            });
            if (res.ok) {
                await fetchData();
                setShowAddModal(false);
                setSelectedCustomerId('');
                setSearchTerm('');
                showSuccess('Başarılı', 'Durak eklendi.');
            } else {
                showError('Hata', 'Durak eklenemedi.');
            }
        } catch (e) {
            showError('Hata', 'Bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteStop = async (stopId: string) => {
        showConfirm('Durağı Kaldır', 'Bu durağı rotadan kaldırmak istiyor musunuz?', async () => {
            try {
                const res = await fetch(`/api/field-sales/stops/${stopId}`, { method: 'DELETE' });
                if (res.ok) {
                    setStops(prev => prev.filter(s => s.id !== stopId));
                    showSuccess('Tamam', 'Durak kaldırıldı.');
                } else {
                    showError('Hata', 'Durak kaldırılamadı.');
                }
            } catch (e) { showError('Hata', 'Bir hata oluştu.'); }
        });
    };

    const handleEditRoute = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/field-sales/routes/${routeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    date: editForm.date,
                    status: editForm.status,
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setRoute((prev: any) => ({ ...prev, ...updated }));
                setShowEditModal(false);
                showSuccess('Başarılı', 'Rota güncellendi.');
            } else {
                showError('Hata', 'Güncelleme başarısız.');
            }
        } catch (e) {
            showError('Hata', 'Bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteRoute = () => {
        showConfirm(
            'Rotayı Sil',
            `"${route?.name}" rotasını ve içindeki tüm durakları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            async () => {
                try {
                    const res = await fetch(`/api/field-sales/routes/${routeId}`, { method: 'DELETE' });
                    if (res.ok) {
                        showSuccess('Silindi', 'Rota başarıyla silindi.');
                        router.push('/field-sales/admin/routes');
                    } else {
                        showError('Hata', 'Rota silinemedi.');
                    }
                } catch (e) { showError('Hata', 'Bir hata oluştu.'); }
            }
        );
    };

    const openEdit = () => {
        setEditForm({
            name: route.name,
            date: route.date ? new Date(route.date).toISOString().split('T')[0] : '',
            status: route.status,
        });
        setShowEditModal(true);
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusColor = (status: string) =>
        STATUS_OPTIONS.find(s => s.value === status)?.color || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    const statusLabel = (status: string) =>
        STATUS_OPTIONS.find(s => s.value === status)?.label || status;

    if (loading) return (
        <div className="p-12 text-center text-white/20 animate-pulse">
            <div className="text-5xl mb-4">🗺️</div>
            <div className="font-black uppercase tracking-widest text-sm">Rota yükleniyor...</div>
        </div>
    );

    if (!route) return null;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#0f111a] text-white font-sans">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 border-b border-white/5 pb-6">
                <div>
                    <button
                        onClick={() => router.push('/field-sales/admin/routes')}
                        className="text-gray-500 hover:text-white mb-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                    >
                        ← Planlama Panosu
                    </button>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-3">{route.name}</h1>
                    <div className="flex flex-wrap gap-2 text-sm">
                        <div className="bg-white/5 px-3 py-1.5 rounded-xl font-bold text-gray-400 flex items-center gap-1.5">
                            👤 {route.staff?.name}
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-xl font-bold text-gray-400 flex items-center gap-1.5">
                            📅 {new Date(route.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl font-black text-xs border ${statusColor(route.status)}`}>
                            {statusLabel(route.status)}
                        </div>
                    </div>
                </div>

                {/* Yönetici Aksiyonları */}
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={openEdit}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm"
                    >
                        ✏️ Düzenle
                    </button>
                    <button
                        onClick={() => { setShowAddModal(true); fetchCustomers(); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm"
                    >
                        + Durak Ekle
                    </button>
                    <button
                        onClick={handleDeleteRoute}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                        title="Rotayı Sil"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#161b22] border border-white/5 p-5 rounded-2xl text-center">
                    <div className="text-3xl font-black text-white">{stops.length}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Toplam Durak</div>
                </div>
                <div className="bg-[#161b22] border border-white/5 p-5 rounded-2xl text-center">
                    <div className="text-3xl font-black text-green-400">{stops.filter((s: any) => s.status === 'VISITED').length}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Ziyaret Edildi</div>
                </div>
                <div className="bg-[#161b22] border border-white/5 p-5 rounded-2xl text-center">
                    <div className="text-3xl font-black text-yellow-400">{stops.filter((s: any) => s.status !== 'VISITED').length}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Bekliyor</div>
                </div>
            </div>

            {/* Durak Listesi */}
            <div className="relative pl-8">
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-white/5" />

                {stops.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl opacity-30">
                        <div className="text-4xl mb-3">📍</div>
                        <div className="text-sm font-bold">Bu rotaya henüz durak eklenmemiş.</div>
                    </div>
                ) : (
                    stops.map((stop: any, index: number) => (
                        <div key={stop.id} className="mb-5 relative group">
                            {/* Nokta */}
                            <div className={`absolute -left-[27px] top-5 w-4 h-4 rounded-full border-2 border-[#0f111a] z-10 transition-all ${stop.status === 'VISITED' ? 'bg-green-500' : 'bg-blue-600 group-hover:scale-125'
                                }`} />

                            {/* Kart */}
                            <div className="bg-[#161b22] border border-white/5 p-4 rounded-2xl hover:border-blue-500/20 transition-all flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-base text-white">{stop.customer?.name}</div>
                                        <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                                            <span>📍 {stop.customer?.district || '-'}, {stop.customer?.city || '-'}</span>
                                            {stop.customer?.phone && <span>📞 {stop.customer.phone}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${stop.status === 'VISITED'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        {stop.status === 'VISITED' ? '✅ Ziyaret Edildi' : '⏳ Bekliyor'}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteStop(stop.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-red-500/40 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
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

            {/* Durak Ekleme Modalı */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg h-[80vh] flex flex-col rounded-3xl shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-black">Durak Ekle</h2>
                            <button onClick={() => { setShowAddModal(false); setSearchTerm(''); setSelectedCustomerId(''); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-xl">×</button>
                        </div>

                        <div className="p-4 border-b border-white/5">
                            <input
                                type="text"
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                                placeholder="Müşteri ara..."
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {customerLoading ? (
                                <div className="text-center p-8 text-gray-500 animate-pulse">Yükleniyor...</div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="text-center p-8 text-gray-600 text-sm">Müşteri bulunamadı.</div>
                            ) : (
                                filteredCustomers.slice(0, 50).map((c: any) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCustomerId(c.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${selectedCustomerId === c.id
                                                ? 'bg-blue-600/20 border-blue-500 text-white'
                                                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] text-gray-300'
                                            }`}
                                    >
                                        <div className="font-bold text-sm">{c.name}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{c.district}, {c.city}</div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={handleAddStop}
                                disabled={!selectedCustomerId || isProcessing}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all text-sm uppercase tracking-widest"
                            >
                                {isProcessing ? 'EKLENİYOR...' : 'ROTAYA EKLE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rota Düzenleme Modalı */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black">Rotayı Düzenle</h2>
                            <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-xl">×</button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Rota Adı</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tarih</label>
                                <input
                                    type="date"
                                    value={editForm.date}
                                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Durum</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setEditForm({ ...editForm, status: opt.value })}
                                            className={`p-3 rounded-xl text-[11px] font-black text-left border transition-all ${editForm.status === opt.value
                                                    ? opt.color
                                                    : 'bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                                    İPTAL
                                </button>
                                <button
                                    onClick={handleEditRoute}
                                    disabled={isProcessing}
                                    className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
