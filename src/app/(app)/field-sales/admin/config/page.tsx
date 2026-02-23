
"use client";

import { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function FieldSalesConfigPage() {
    const { showError, showSuccess, showConfirm } = useModal();
    const [config, setConfig] = useState({ maxDistance: 1500, allowOutOfRange: true });
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configRes, requestsRes] = await Promise.all([
                fetch('/api/field-sales/admin/settings'),
                fetch('/api/field-sales/admin/location-requests')
            ]);

            if (configRes.ok) {
                const data = await configRes.json();
                setConfig(data.config);
            }
            if (requestsRes.ok) {
                const data = await requestsRes.json();
                setRequests(data.requests);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/field-sales/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config })
            });
            if (res.ok) showSuccess('Başarılı', 'Ayarlar güncellendi.');
            else showError('Hata', 'Ayarlar kaydedilemedi.');
        } catch (e) {
            showError('Hata', 'Bağlantı hatası.');
        } finally {
            setSaving(false);
        }
    };

    const handleProcessRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
        const title = action === 'APPROVE' ? 'Onayla' : 'Reddet';
        const msg = action === 'APPROVE' ? 'Müşteri konumu güncellenecektir. Onaylıyor musunuz?' : 'Talep reddedilecektir. Emin misiniz?';

        showConfirm(title, msg, async () => {
            try {
                const res = await fetch('/api/field-sales/admin/location-requests/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId, action })
                });
                if (res.ok) {
                    showSuccess('Başarılı', 'İşlem tamamlandı.');
                    fetchData();
                } else {
                    showError('Hata', 'İşlem başarısız.');
                }
            } catch (e) {
                showError('Hata', 'Bağlantı hatası.');
            }
        });
    };

    if (loading) return <div className="p-12 text-white/50 text-center">Yükleniyor...</div>;

    return (
        <div className="p-8 max-w-[1200px] mx-auto min-h-screen text-white">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">⚙️ Saha Satış Ayarları & Talepler</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Configuration Section */}
                <div className="space-y-6">
                    <div className="bg-[#161b22] border border-white/5 p-8 rounded-3xl h-full">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🛡️ GPS Güvenlik Kuralları</h2>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">MAKSİMUM MESAFE (METRE)</label>
                                <input
                                    type="number"
                                    value={config.maxDistance}
                                    onChange={(e) => setConfig({ ...config, maxDistance: parseInt(e.target.value) })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 font-bold text-blue-400 focus:border-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500">Personel müşteri konumundan bu mesafeden daha uzaktaysa "Kapsam Dışı" sayılır.</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div>
                                    <div className="font-bold text-sm">Kapsam Dışı Ziyarete İzin Ver</div>
                                    <div className="text-xs text-gray-500">Pasif yapılırsa, personel mesafeden uzaksa check-in yapamaz.</div>
                                </div>
                                <button
                                    onClick={() => setConfig({ ...config, allowOutOfRange: !config.allowOutOfRange })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${config.allowOutOfRange ? 'bg-green-600' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.allowOutOfRange ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <button
                                onClick={handleSaveConfig}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black transition-all shadow-lg shadow-blue-900/20"
                            >
                                {saving ? 'KAYDEDİLİYOR...' : 'AYARLARI KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Requests Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">📍 Bekleyen Konum Talepleri</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {requests.filter(r => r.status === 'PENDING').length === 0 && (
                            <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center text-gray-500">
                                Bekleyen talep bulunmuyor.
                            </div>
                        )}
                        {requests.filter(r => r.status === 'PENDING').map((req: any) => (
                            <div key={req.id} className="bg-[#161b22] border border-blue-500/20 p-6 rounded-3xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-black text-blue-400 uppercase mb-1">{req.staff?.name} Talep Etti</div>
                                        <div className="font-bold text-lg">{req.customer?.name}</div>
                                    </div>
                                    <div className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-1 rounded">PENDING</div>
                                </div>

                                <div className="bg-black/30 p-4 rounded-2xl text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 italic">Eski Konum:</span>
                                        <span className="text-white">{req.customer?.lat?.toFixed(5)}, {req.customer?.lng?.toFixed(5)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 italic">Yeni Konum:</span>
                                        <span className="text-green-400 font-bold">{req.requestedLat.toFixed(5)}, {req.requestedLng.toFixed(5)}</span>
                                    </div>
                                    {req.notes && <div className="pt-2 border-t border-white/5 text-gray-400">📝 {req.notes}</div>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleProcessRequest(req.id, 'APPROVE')}
                                        className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white py-3 rounded-xl font-bold text-sm transition-all"
                                    >
                                        Onayla
                                    </button>
                                    <button
                                        onClick={() => handleProcessRequest(req.id, 'REJECT')}
                                        className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-3 rounded-xl font-bold text-sm transition-all"
                                    >
                                        Reddet
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Approved/Rejected History - Small divider */}
                        {requests.some(r => r.status !== 'PENDING') && (
                            <div className="pt-8 opacity-40">
                                <h3 className="text-xs font-black uppercase mb-4">Talep Geçmişi</h3>
                                {requests.filter(r => r.status !== 'PENDING').slice(0, 5).map((req: any) => (
                                    <div key={req.id} className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                                        <span>{req.customer?.name}</span>
                                        <span className={req.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}>{req.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
