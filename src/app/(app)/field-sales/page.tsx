
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FieldSalesAgentDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [targets, setTargets] = useState<any[]>([]);
    const [todayRoute, setTodayRoute] = useState<any>(null);
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [targetsRes, routesRes, campaignsRes] = await Promise.all([
                    fetch('/api/staff/targets?mine=true'),
                    fetch('/api/field-sales/routes?mine=true'),
                    fetch('/api/campaigns'),
                ]);

                if (targetsRes.ok) {
                    const data = await targetsRes.json();
                    setTargets(Array.isArray(data) ? data : []);
                }

                if (routesRes.ok) {
                    const data = await routesRes.json();
                    const routes = Array.isArray(data) ? data : [];
                    const today = new Date().toISOString().split('T')[0];
                    const tr = routes.find((r: any) => new Date(r.date).toISOString().split('T')[0] === today);
                    setTodayRoute(tr || null);
                }

                if (campaignsRes.ok) {
                    const data = await campaignsRes.json();
                    const campaigns = Array.isArray(data) ? data : (data.campaigns || []);
                    const now = new Date();
                    const active = campaigns.filter((c: any) => {
                        if (!c.isActive) return false;
                        if (c.endDate && new Date(c.endDate) < now) return false;
                        return true;
                    });
                    setActiveCampaigns(active);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="p-8 text-center text-white/20 animate-pulse">
            <div className="text-5xl mb-4">🏁</div>
            <div className="font-black uppercase tracking-widest text-sm">Yükleniyor...</div>
        </div>
    );

    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

    const getCampaignIcon = (type: string) => {
        if (type === 'loyalty_points') return '💎';
        if (type === 'buy_x_get_free') return '🎁';
        if (type === 'buy_x_get_discount') return '🏷️';
        return '💳';
    };

    const getCampaignLabel = (camp: any) => {
        if (camp.type === 'loyalty_points') return `%${((camp.pointsRate || 0) * 100).toFixed(0)} Sadakat Puanı`;
        if (camp.type === 'payment_method_discount') return `%${((camp.discountRate || 0) * 100).toFixed(0)} Ödeme İndirimi`;
        if (camp.type === 'buy_x_get_discount') return `${camp.conditions?.buyQuantity} Alana %${camp.conditions?.rewardValue} İndirim`;
        if (camp.type === 'buy_x_get_free') return `${camp.conditions?.buyQuantity} Alana ${camp.conditions?.rewardQuantity} Bedava`;
        return camp.name;
    };

    return (
        <div className="p-6 md:p-10 min-h-screen bg-[#0f111a] text-white">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-1">Saha Satış Paneli</h1>
                        <p className="text-gray-500 text-sm font-medium capitalize">{today}</p>
                    </div>
                    <button
                        onClick={() => router.push('/field-mobile/routes')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 text-sm"
                    >
                        <span>📱</span> MOBİL GÖRÜNÜM
                    </button>
                </div>

                {/* Bugünün Rotası */}
                <div
                    onClick={() => todayRoute ? router.push(`/field-mobile/routes/${todayRoute.id}`) : router.push('/field-mobile/routes')}
                    className={`rounded-3xl p-6 cursor-pointer transition-all hover:scale-[1.01] border ${todayRoute
                            ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/30'
                            : 'bg-white/[0.03] border-white/5 border-dashed'
                        }`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">📅 Bugünün Rotası</p>
                            {todayRoute ? (
                                <>
                                    <h2 className="text-xl font-black text-white mb-1">{todayRoute.name}</h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <span className="text-green-400 font-black text-xl">{todayRoute._count?.stops || 0}</span>
                                            <span className="text-xs font-bold text-gray-500">gidilecek nokta</span>
                                        </span>
                                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${todayRoute.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                                                todayRoute.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-white/5 text-gray-500'
                                            }`}>
                                            {todayRoute.status === 'ACTIVE' ? '🟢 Aktif' :
                                                todayRoute.status === 'COMPLETED' ? '✅ Tamamlandı' : '⏳ Bekliyor'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-black text-white/40 mb-1">Bugün için rota atanmamış</h2>
                                    <p className="text-xs text-gray-600">Tüm rotalarınızı görmek için tıklayın.</p>
                                </>
                            )}
                        </div>
                        <span className="text-3xl opacity-30">🏁</span>
                    </div>
                </div>

                {/* Aktif Kampanyalar */}
                {activeCampaigns.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                AKTİF KAMPANYALAR ({activeCampaigns.length})
                            </h2>
                            <button
                                onClick={() => router.push('/settings?tab=campaigns')}
                                className="text-[10px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-widest"
                            >
                                + YENİ KAMPANYA EKLE →
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeCampaigns.slice(0, 4).map((camp: any) => (
                                <div
                                    key={camp.id}
                                    className="bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl flex-shrink-0">
                                        {getCampaignIcon(camp.type)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm text-white truncate">{camp.name}</div>
                                        <div className="text-[11px] text-orange-400 font-bold">{getCampaignLabel(camp)}</div>
                                        {camp.targetCustomerCategoryIds?.length > 0 && (
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                Hedef: {camp.targetCustomerCategoryIds.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Kampanya yoksa kısa uyarı */}
                {activeCampaigns.length === 0 && (
                    <div
                        onClick={() => router.push('/settings?tab=campaigns')}
                        className="border border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-500/30 transition-all group"
                    >
                        <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-400">
                            <span>🎯</span>
                            <span>Aktif kampanya bulunmuyor.</span>
                        </div>
                        <span className="text-[10px] font-black text-orange-500/50 group-hover:text-orange-400 uppercase">Kampanya Oluştur →</span>
                    </div>
                )}

                {/* Hedefler */}
                {targets.length > 0 && (
                    <div>
                        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">HEDEF İLERLEMESİ</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {targets.map((t: any) => {
                                const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                return (
                                    <div key={t.id} className="bg-[#161b22] border border-white/5 p-5 rounded-2xl">
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                                            {t.type === 'TURNOVER' ? '💰 Satış Hedefi' : '📍 Ziyaret Hedefi'}
                                        </div>
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="text-2xl font-black">
                                                {t.type === 'TURNOVER' ? `₺${t.currentValue.toLocaleString()}` : `${t.currentValue}`}
                                            </div>
                                            <div className={`font-black text-lg ${progress >= 100 ? 'text-green-400' : 'text-blue-400'}`}>%{progress}</div>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                        {t.type === 'TURNOVER' && (
                                            <div className="mt-2 text-[10px] text-gray-600 font-bold">Hedef: ₺{t.targetValue.toLocaleString()}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hızlı Erişim Kartları */}
                <div>
                    <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">HIZLI ERİŞİM</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: '🏁', label: 'Rotalarım', desc: 'Aktif ziyaretler', path: '/field-mobile/routes', accent: 'from-blue-600 to-blue-700', featured: true },
                            { icon: '👥', label: 'Müşterilerim', desc: 'Portföy ve ekstreler', path: '/field-mobile/customers', accent: null },
                            { icon: '📊', label: 'Raporlarım', desc: 'Satış analizi', path: '/field-mobile/reports', accent: null },
                            { icon: '💸', label: 'Masraflarım', desc: 'Harcama yönetimi', path: '/field-mobile/expenses', accent: null },
                            { icon: '🎯', label: 'Hedeflerim', desc: 'Prim ve ilerlemeler', path: '/field-mobile/targets', accent: null },
                            { icon: '📝', label: 'Geçmiş', desc: 'Eski ziyaret kayıtları', path: '/field-mobile/visits', accent: null },
                        ].map((card) => (
                            <div
                                key={card.path}
                                onClick={() => router.push(card.path)}
                                className={`p-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all group ${card.featured
                                        ? `bg-gradient-to-br ${card.accent} shadow-xl shadow-blue-900/20`
                                        : 'bg-[#161b22] border border-white/5 hover:border-white/15'
                                    }`}
                            >
                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{card.icon}</div>
                                <div className="font-black text-base mb-0.5">{card.label}</div>
                                <div className={`text-xs ${card.featured ? 'text-blue-100/70' : 'text-gray-500'}`}>{card.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PWA Bilgisi */}
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl">📱</span>
                        <div>
                            <h3 className="font-bold text-sm">Mobil Uygulama Olarak Kullanın</h3>
                            <p className="text-xs text-gray-500">Telefona yükleyerek daha hızlı erişim sağlayın.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { step: '1', text: 'Telefondan periodya.com/field-mobile adresine gidin.' },
                            { step: '2', text: 'Tarayıcı menüsünden "Ana Ekrana Ekle" seçeneğini tıklayın.' },
                            { step: '3', text: 'Hazır! Artık uygulama gibi çalışıyor.' },
                        ].map((s) => (
                            <div key={s.step} className="bg-black/30 p-3 rounded-xl border border-white/5">
                                <div className="text-[10px] font-black text-gray-600 uppercase mb-1.5">ADIM {s.step}</div>
                                <div className="text-xs text-gray-400">{s.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
