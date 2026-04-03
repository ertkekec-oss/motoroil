"use client";

import React, { useState } from 'react';
import { 
    LayoutDashboard, Gift, MapPin, Navigation, Map, Users, Star, 
    TrendingUp, Clock, CalendarDays, CheckCircle2, ChevronRight, Activity, ChevronDown 
} from 'lucide-react';

type TabType = 'dashboard' | 'campaigns' | 'live' | 'today' | 'my-routes' | 'visits';

export default function FieldDashboardClient() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'campaigns', label: 'Saha Kampanyaları', icon: Gift },
        { id: 'live', label: 'Canlı Takip', icon: Activity },
        { id: 'today', label: 'Bugünün Rotası', icon: Navigation },
        { id: 'my-routes', label: 'Rotalarım', icon: Map },
        { id: 'visits', label: 'Müşteriler & Ziyaretler', icon: Users }
    ] as const;

    // Ortak Tab Stili (Yüksek Kontrast, Soft Kenarlar)
    const renderTabs = () => (
        <div className="flex overflow-x-auto custom-scroll snap-x pb-4 mb-4 gap-2 border-b border-slate-200 dark:border-white/5">
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
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

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
            {/* KPI Kartları - Enterprise Soft Container Modeli */}
            {[
                { title: 'Aktif Rotadaki Araç', value: '14', sub: '%12 artış', icon: Navigation, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { title: 'Günlük Ziyaret Hedefi', value: '85', sub: 'Tamamlanan: 42', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { title: 'Saha Kampanya Satışı', value: '₺142K', sub: 'Düne göre +$5K', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                { title: 'Geciken Görev', value: '3', sub: 'Kritik Uyarı', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
            ].map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-[#1e293b] rounded-[20px] p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 bg-current pointer-events-none" style={{ color: "var(--tw-colors-slate-900)" }}></div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${kpi.bg}`}>
                        <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                    <h3 className="text-[26px] font-black text-slate-800 dark:text-white leading-none tracking-tight mb-2">{kpi.value}</h3>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{kpi.title}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-400">
                        {kpi.sub}
                    </div>
                </div>
            ))}

            <div className="lg:col-span-3 bg-white dark:bg-[#1e293b] rounded-[20px] p-6 shadow-sm border border-slate-200 dark:border-white/5 min-h-[300px]">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">Genel Aktarım ve Performans</h2>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Saha Ekiplerinin Canlı Durumu</span>
                    </div>
                    <button className="flex items-center gap-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-blue-500 transition-colors">
                        Son 7 Gün <ChevronDown className="w-3 h-3" />
                    </button>
                 </div>
                 <div className="w-full h-full min-h-[250px] bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500 animate-pulse" /> Veriler Yükleniyor...
                    </span>
                 </div>
            </div>

            <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[20px] p-6 shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute inset-0 bg-[url('/bg-dots.svg')] opacity-20"></div>
                <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md mb-6">
                        <Star className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-black leading-tight mb-2">Haftanın Lideri</h3>
                    <p className="text-blue-100 text-[13px] font-medium leading-relaxed">Güney Marmara Bölge Sorumlusu <b>Kemal Yılmaz</b>, bu hafta %115 başarı oranına ulaştı.</p>
                </div>
                <div className="relative z-10 mt-6 flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-200">Detayları İncele</span>
                    <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white flex items-center justify-center transition-colors text-white hover:text-blue-600 shadow-sm">
                        <ChevronRight className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderEmptyState = (title: string, desc: string, icon: any) => {
        const Icon = icon;
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm flex items-center justify-center mb-6 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                    <Icon className="w-10 h-10 text-blue-500 relative z-10" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
                    {title} Modülü Yapılandırılıyor
                </h2>
                <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                    {desc} Bu bölümün entegrasyonu tamamlandığında anlık verileriniz burada listelenecektir.
                </p>
                <div className="mt-8 flex gap-3">
                    <button onClick={() => setActiveTab('dashboard')} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-300 text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Dashboard'a Dön
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-[12px] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors">
                        Ayarları Gözden Geçir
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans dark:bg-[#0f172a]">
            {/* BAŞLIK BANDI */}
            <div className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-blue-600 text-white shadow-lg shadow-blue-500/20 shrink-0">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-1.5 truncate">
                                Servis Saha Paneli
                            </h1>
                            <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 truncate block">
                                Saha Operasyonları Yönetim Merkezi
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ANA İÇERİK ALANI */}
            <div className="max-w-[1600px] mx-auto pt-6 px-4 sm:px-6 lg:px-8">
                {renderTabs()}

                <div className="mt-6">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'campaigns' && renderEmptyState('Saha Kampanyaları', 'Saha personellerinizin müşterilere özel anlık indirim veya promosyon tanımlayabileceği kampanya motoru.', Gift)}
                    {activeTab === 'live' && renderEmptyState('Canlı Takip', 'Tüm ekiplerinizin anlık konumlarını harita üzerinden canlı olarak izleyebileceğiniz telemetri paneli.', Activity)}
                    {activeTab === 'today' && renderEmptyState('Bugünün Rotası', 'Teknisyenlerin bugün ziyaret etmesi planlanan tüm noktaların navigasyon sırasıyla listelendiği rotaboard.', Navigation)}
                    {activeTab === 'my-routes' && renderEmptyState('Rotalarım', 'Personele atanmış gelecek günlerin ve geçmişte tamamlanmış saha rota arşivlerinin bulunduğu yönetim paneli.', Map)}
                    {activeTab === 'visits' && renderEmptyState('Müşteriler & Ziyaretler', 'Sahada yapılan ziyaretlerin anlık tutanakları, fotoğraf ekleri ve imzaların arşivlendiği müşteri log panosu.', Users)}
                </div>
            </div>
        </div>
    );
}
