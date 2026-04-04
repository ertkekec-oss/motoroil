"use client";

import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Gift, MapPin, Navigation, Map, Users, Star, 
    TrendingUp, Clock, CalendarDays, CheckCircle2, ChevronRight, Activity, ChevronDown,
    Wrench, Settings as ConfigIcon, ListTodo, Search, Plus
} from 'lucide-react';

type TabType = 'dashboard' | 'campaigns' | 'live' | 'today' | 'my-routes' | 'visits';

export default function FieldDashboardClient() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');

    const [kpiStats, setKpiStats] = useState({
        activeVehicles: 0,
        dailyTarget: 0,
        completedTarget: 0,
        salesSum: 0,
        delayedTasks: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                // Sadece servis verilerini (görevler, iş emirleri, servis kampanyaları) çeker
                const [tasksRes, campaignsRes] = await Promise.all([
                    fetch('/api/workflow/tasks'),
                    fetch('/api/campaigns?channel=SERVICE')
                ]);
                
                let activeRoutes = 3;
                let activeTasks = [];
                if (tasksRes.ok) {
                    activeTasks = await tasksRes.json();
                    setTasks(Array.isArray(activeTasks) ? activeTasks : []);
                }
                
                if (campaignsRes.ok) {
                    const campData = await campaignsRes.json();
                    setCampaigns(Array.isArray(campData) ? campData.filter((c:any) => c.status === 'ACTIVE' || c.isActive) : []);
                }

                setKpiStats({
                    activeVehicles: activeRoutes,
                    dailyTarget: 14,
                    completedTarget: Array.isArray(activeTasks) ? activeTasks.filter((t:any) => t.status === 'COMPLETED').length : 2,
                    salesSum: 0,
                    delayedTasks: Array.isArray(activeTasks) ? activeTasks.filter((t:any) => t.status === 'DELAYED').length : 0
                });
            } catch (err) {
                console.error(err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

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
            {/* KPI Kartları - Enterprise Soft Container Modeli (Servis Versiyonu) */}
            {[
                { title: 'Aktif Servis Aracı', value: statsLoading ? '...' : kpiStats.activeVehicles.toString(), sub: 'Saha Operasyonunda', icon: Navigation, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { title: 'Günlük Servis Hedefi', value: statsLoading ? '...' : kpiStats.dailyTarget.toString(), sub: `Tamamlanan İş Emri: ${kpiStats.completedTarget}`, icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { title: 'Servis Kampanyaları', value: statsLoading ? '...' : campaigns.length.toString(), sub: 'Aktif Bakım Paketleri', icon: Gift, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                { title: 'Geciken İş Emri', value: statsLoading ? '...' : kpiStats.delayedTasks.toString(), sub: 'Kritik Operasyon Uyarısı', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
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
                    
                    {/* Servis Saha Kampanyaları */}
                    {activeTab === 'campaigns' && (
                        <div className="animate-in fade-in duration-500 bg-white dark:bg-[#1e293b] rounded-[20px] p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-white/5">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                    <Gift className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Servis Paket Kampanyaları</h2>
                                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">Müşterilere sunulan periyodik bakım fırsatları</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {campaigns.length > 0 ? campaigns.map((cmp: any, i: number) => (
                                    <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-colors bg-slate-50/50 dark:bg-[#0f172a]/50">
                                        <div className={`px-3 py-1 inline-flex text-[11px] font-black uppercase tracking-widest rounded-lg mb-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400`}>
                                            {cmp.discountRate ? `%${cmp.discountRate} İndirim` : 'Aktif'}
                                        </div>
                                        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-2 leading-tight">{cmp.name}</h3>
                                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">{cmp.description || 'Bu kampanya için detaylı açıklama girilmemiştir.'}</p>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                        <Gift className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-[14px] font-medium">Şu an aktif bir servis kampanyası bulunmuyor.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Teknisyen Canlı Takip */}
                    {activeTab === 'live' && (
                        <div className="animate-in fade-in duration-500 grid lg:grid-cols-4 gap-6 h-[calc(100vh-280px)]">
                            <div className="lg:col-span-1 bg-white dark:bg-[#1e293b] rounded-[20px] shadow-sm border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-200 dark:border-white/5">
                                    <h2 className="text-[14px] font-black text-slate-800 dark:text-white">Aktif Teknisyenler</h2>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Sahadaki Servis Ekipleri</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll">
                                    {['Ali Kemal (Tamir Aracı #1)', 'Ozan G. (Bakım Aracı #2)', 'Mehmet Y. (Hızlı Servis)'].map((tech, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800/30 transition-all">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                    <Wrench className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#1e293b] rounded-full"></div>
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{tech}</h4>
                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Sahada (Rota Üzerinde)</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-3 bg-slate-100 dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 bg-[url('https://maps.wikimedia.org/osm-intl/12/2365/1535.png')] bg-cover bg-center mix-blend-luminosity"></div>
                                <div className="relative z-10 flex flex-col items-center p-6 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-sm">
                                    <Activity className="w-10 h-10 text-blue-500 mb-4 animate-pulse" />
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Canlı Harita Yükleniyor</h3>
                                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">Saha Servis Aracı Telemetri Verisi</p>
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-1/3 animate-ping" style={{ animationDuration: '2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* İş Emirleri / Servis Rotaları */}
                    {(activeTab === 'today' || activeTab === 'my-routes') && (
                        <div className="animate-in fade-in duration-500 bg-white dark:bg-[#1e293b] rounded-[20px] p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-white/5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{activeTab === 'today' ? 'Bugünün İş Rotaları' : 'Haftalık Servis Rotaları'}</h2>
                                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                        {activeTab === 'today' ? 'Planlanan Saha Servis Adımları' : 'Geçmiş ve Gelecek İş Rotası Arşivi'}
                                    </p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-bold shadow-sm hover:bg-blue-700 transition-colors">
                                    <Plus className="w-4 h-4" /> Yeni İş Emri Ekle
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {tasks.length > 0 ? (
                                    tasks.map((task: any, idx: number) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:shadow-md transition-shadow">
                                            <div className="w-12 h-12 shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-xl flex items-center justify-center font-black text-lg">
                                                #{idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                        {task.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                                                    </span>
                                                    <span className="text-[12px] text-slate-400 font-bold">{new Date(task.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">{task.title || `Özel İş Emri ${task.id.slice(0,6)}`}</h3>
                                                {task.description && <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>}
                                            </div>
                                            <div className="shrink-0 flex items-center">
                                                <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <ListTodo className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Gösterilecek iş emri bulunamadı</h3>
                                        <p className="text-[13px] text-slate-500 mt-1">Bu görünüm için henüz bir saha rota kaydı yok.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Ziyaretler & Müşteri Geçmişi */}
                    {activeTab === 'visits' && (
                        <div className="animate-in fade-in duration-500 p-8 rounded-[20px] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 flex flex-col sm:flex-row items-center gap-8 justify-between">
                            <div>
                                <h2 className="text-xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">Müşteriler & Servis Geçmişi</h2>
                                <p className="text-[13px] font-medium text-indigo-700/70 dark:text-indigo-300 mt-2 max-w-md leading-relaxed">
                                    Servis departmanının saha ziyaretlerini analiz edin, tamamlanmış formları görün ve 
                                    müşteri cari listelerinde arama yapın.
                                </p>
                            </div>
                            <button className="shrink-0 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 text-white font-bold text-[13px] transition-colors flex items-center gap-2">
                                <Search className="w-4 h-4" /> Tüm Ziyaret Geçmişi
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
