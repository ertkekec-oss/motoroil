"use client";

import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Map, TrendingUp, Activity, CheckCircle2, ChevronRight,
    MapPin, Users, Target, Search, Clock, Gift
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

import AdminRoutesPage from './admin/routes/page';
import LiveFieldTrackingPage from './admin/live/page';
import FieldSalesIntelligencePage from './intelligence/page';

import { useAuth } from '@/contexts/AuthContext';

export default function FieldSalesUnifiedDashboard() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'intelligence' | 'live'>('overview');
    
    // Overview states
    const [targets, setTargets] = useState<any[]>([]);
    const [todayRoute, setTodayRoute] = useState<any>(null);
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab !== 'overview') return;
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
                    const active = campaigns.filter((c: any) => c.isActive && (!c.endDate || new Date(c.endDate) >= now));
                    setActiveCampaigns(active);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const tabs = [
        { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
        { id: 'routes', label: 'Rota & Müşteri', icon: Map },
        { id: 'intelligence', label: 'AI Zeka & Rota', icon: TrendingUp },
        { id: 'live', label: 'Canlı Takip', icon: Activity },
    ] as const;

    const renderTabs = () => (
        <div className="flex overflow-x-auto custom-scroll snap-x pb-4 mb-4 gap-2 border-b border-slate-200 dark:border-white/5">
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`snap-start whitespace-nowrap shrink-0 flex items-center gap-2.5 px-4 h-12 rounded-t-xl sm:rounded-xl font-bold text-[13px] tracking-wide transition-all ${
                            isActive 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800/50 dark:hover:text-white'
                        }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );

    const renderOverview = () => {
        if (loading) return (
            <div className="p-12 text-center text-slate-400 animate-pulse">
                <div className="text-4xl mb-4">🏁</div>
                <div className="font-bold uppercase tracking-widest text-[13px]">SalesX Yükleniyor...</div>
            </div>
        );

        const textMain = isLight ? 'text-slate-800' : 'text-white';
        const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
        const bgSurface = isLight ? 'bg-white' : 'bg-[#1e293b]';
        const borderColor = isLight ? 'border-slate-200' : 'border-white/5';

        const getCampaignLabel = (camp: any) => {
            if (camp.type === 'loyalty_points') return `%${((camp.pointsRate || 0) * 100).toFixed(0)} Sadakat Puanı`;
            if (camp.type === 'payment_method_discount') return `%${((camp.discountRate || 0) * 100).toFixed(0)} Ödeme İndirimi`;
            if (camp.type === 'buy_x_get_discount') return `${camp.conditions?.buyQuantity} Alana %${camp.conditions?.rewardValue} İndirim`;
            if (camp.type === 'buy_x_get_free') return `${camp.conditions?.buyQuantity} Alana ${camp.conditions?.rewardQuantity} Bedava`;
            return camp.name;
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Bugünün Rotası Soft Container */}
                <div 
                    onClick={() => todayRoute ? router.push(`/field-mobile/routes/${todayRoute.id}`) : router.push('/field-mobile/routes')}
                    className={`rounded-[24px] p-6 sm:p-8 cursor-pointer transition-all hover:scale-[1.01] border relative overflow-hidden group ${
                        todayRoute 
                        ? (isLight ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-blue-500/10 border-blue-500/20')
                        : `${bgSurface} ${borderColor} shadow-sm border-dashed`
                    }`}
                >
                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 bg-current pointer-events-none" style={{ color: "var(--tw-colors-blue-600)" }}></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> BUGÜNÜN ROTASI
                            </p>
                            {todayRoute ? (
                                <>
                                    <h2 className={`text-2xl sm:text-3xl font-black ${textMain} mb-2 tracking-tight`}>{todayRoute.name}</h2>
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-green-500 font-black text-2xl">{todayRoute._count?.stops || 0}</span>
                                            <span className={`text-[12px] font-bold ${textMuted} uppercase tracking-wider`}>Nokta</span>
                                        </div>
                                        <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${
                                            todayRoute.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                            todayRoute.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                            'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'
                                        }`}>
                                            {todayRoute.status === 'ACTIVE' ? '🟢 Aktif' : todayRoute.status === 'COMPLETED' ? '✅ Tamamlandı' : '⏳ Bekliyor'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className={`text-xl font-black ${textMuted} mb-1 tracking-tight`}>Bugün için rota atanmamış</h2>
                                    <p className={`text-[13px] font-medium ${textMuted}`}>Mobil görünüme geçerek tüm rotalarınızı görebilirsiniz.</p>
                                </>
                            )}
                        </div>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isLight ? 'bg-white shadow-sm' : 'bg-white/5'} ${todayRoute ? 'text-blue-500' : textMuted}`}>
                            <MapPin className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hedefler */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className={`text-[11px] font-black ${textMuted} uppercase tracking-widest`}>Hedef İlerlemesi</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {targets.length > 0 ? targets.map((t: any) => {
                                const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                return (
                                    <div key={t.id} className={`${bgSurface} ${borderColor} shadow-sm border p-5 rounded-[20px]`}>
                                        <div className={`text-[10px] font-black ${textMuted} uppercase tracking-widest mb-3 flex items-center gap-1.5`}>
                                            <Target className="w-3.5 h-3.5" />
                                            {t.type === 'TURNOVER' ? 'Satış Hedefi' : 'Ziyaret Hedefi'}
                                        </div>
                                        <div className="flex justify-between items-end mb-3">
                                            <div className={`text-2xl font-black ${textMain} tracking-tight`}>
                                                {t.type === 'TURNOVER' ? `₺${t.currentValue.toLocaleString()}` : `${t.currentValue}`}
                                            </div>
                                            <div className={`font-black text-lg ${progress >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>%{progress}</div>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                        {t.type === 'TURNOVER' && (
                                            <div className={`mt-3 text-[11px] font-bold ${textMuted}`}>Hedef: ₺{t.targetValue.toLocaleString()}</div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className={`${bgSurface} ${borderColor} border border-dashed rounded-[20px] p-6 text-center col-span-2`}>
                                    <Target className={`w-8 h-8 mx-auto mb-2 opacity-20`} />
                                    <p className={`text-[13px] font-medium ${textMuted}`}>Tanımlı hedef bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Aktif Kampanyalar */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className={`text-[11px] font-black ${textMuted} uppercase tracking-widest flex items-center gap-2`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Aktif Kampanyalar
                            </h2>
                        </div>
                        <div className={`${bgSurface} ${borderColor} shadow-sm border rounded-[20px] p-5 h-full min-h-[250px]`}>
                            {activeCampaigns.length > 0 ? (
                                <div className="space-y-3">
                                    {activeCampaigns.slice(0, 4).map((camp: any) => (
                                        <div key={camp.id} className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                                                <div className="text-orange-500 text-lg">💡</div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className={`font-bold text-[13px] ${textMain} truncate`}>{camp.name}</div>
                                                <div className="text-[11px] font-bold text-orange-500 mt-0.5">{getCampaignLabel(camp)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <Gift className="w-8 h-8 text-orange-500 opacity-20 mb-2" />
                                    <p className={`text-[13px] font-medium ${textMuted}`}>Aktif saha kampanyası yok.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hızlı Erişim Kartları */}
                <div>
                    <h2 className={`text-[11px] font-black ${textMuted} uppercase tracking-widest mb-4`}>Hızlı Erişim</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Map, label: 'Mobil Görünüm', desc: 'Saha web uygulaması', path: '/field-mobile/routes' },
                            { icon: Users, label: 'Müşteriler', desc: 'Geçmişi ve siparişleri', path: '/field-mobile/customers' },
                            { icon: CheckCircle2, label: 'Ziyaretler', desc: 'Geçmiş kayıtlar', path: '/field-mobile/visits' },
                            { icon: MapPin, label: 'Personel Portali', desc: 'Vardiya ve performans', path: '/staff/me' }
                        ].map((card) => (
                            <div
                                key={card.path}
                                onClick={() => router.push(card.path)}
                                className={`${bgSurface} ${borderColor} border shadow-sm p-5 rounded-[20px] cursor-pointer hover:-translate-y-1 transition-all group`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${isLight ? 'bg-slate-50 text-blue-600' : 'bg-slate-800 text-blue-400'} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <div className={`font-black text-[14px] ${textMain} mb-0.5 tracking-tight`}>{card.label}</div>
                                <div className={`text-[12px] font-medium ${textMuted}`}>{card.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div data-pos-theme={theme} className={`min-h-screen transition-colors duration-300 w-full ${isLight ? 'bg-slate-50' : 'bg-[#0f172a]'}`}>
            {/* BAŞLIK BANDI */}
            <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-[#1e293b] border-white/5'} border-b sticky top-0 z-20`}>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-blue-600 text-white shadow-lg shadow-blue-500/20 shrink-0">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'} leading-none mb-1.5 truncate`}>
                                    SalesX Saha Paneli
                                </h1>
                                <span className={`text-[11px] sm:text-[12px] font-bold tracking-[0.2em] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'} truncate block`}>
                                    Müşteri, Rota & Canlı Takip Merkezi
                                </span>
                            </div>
                        </div>
                        <div className="hidden sm:flex gap-3">
                            <button
                                onClick={() => router.push('/field-mobile/routes')}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-[12px] tracking-wide"
                            >
                                <LayoutDashboard className="w-4 h-4" /> MOBİL VERİSYON
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ANA İÇERİK ALANI */}
            <div className="max-w-[1600px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16">
                {renderTabs()}

                <div className="mt-2">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'routes' && <AdminRoutesPage isEmbedded={true} />}
                    {activeTab === 'intelligence' && <FieldSalesIntelligencePage isEmbedded={true} />}
                    {activeTab === 'live' && <LiveFieldTrackingPage isEmbedded={true} />}
                </div>
            </div>
        </div>
    );
}
