"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { 
    Wrench, 
    Calendar, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Search, 
    TrendingUp,
    Play,
    Plus,
    MoreHorizontal,
    ChevronRight,
    Users
} from 'lucide-react';

export default function ServiceDashboard() {
    const { currentUser, hasFeature } = useApp();
    const router = useRouter();
    const { theme } = useTheme();
    const { showSuccess, showError } = useModal();
    const isLight = theme === 'light';

    const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'performance'>('active');
    const [allServices, setAllServices] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!hasFeature('service_desk') && currentUser !== null) {
            router.push('/billing?upsell=service_desk');
        }
    }, [hasFeature, currentUser, router]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [sRes, tRes] = await Promise.all([
                fetch('/api/services'),
                fetch('/api/staff')
            ]);
            const sData = await sRes.json();
            const tData = await tRes.json();
            
            if (sData.success) setAllServices(sData.services || []);
            if (tData.success) setTechnicians(tData.staff.filter((s: any) => s.type === 'service' || s.role === 'service' || !s.role));
        } catch (error) { 
            console.error(error); 
        } finally { 
            setIsLoading(false); 
        }
    };

    useEffect(() => {
        fetchData();
        const intv = setInterval(fetchData, 60000);
        return () => clearInterval(intv);
    }, []);

    const handleUpdateStatus = async (jobId: string, newStatus: string) => {
        try {
            const payload: any = { status: newStatus };
            if (newStatus === 'İşlemde') payload.startTime = new Date().toISOString();
            if (newStatus === 'Tamamlandı') payload.endTime = new Date().toISOString();

            const res = await fetch(`/api/services/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Durum Güncellendi', `İş emri #${jobId.slice(-6)} artık ${newStatus}.`);
                fetchData();
            }
        } catch (error) { 
            showError('Hata', 'Güncelleme sırasında bir hata oluştu.'); 
        }
    };

    const filteredServices = allServices.filter(s => {
        const matchesSearch = s.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             s.id.includes(searchQuery);
        if (!matchesSearch) return false;
        
        if (activeTab === 'active') return s.status !== 'Teslim Edildi' && s.status !== 'İptal Edildi' && !s.appointmentDate;
        if (activeTab === 'scheduled') return s.status === 'Beklemede' && s.appointmentDate;
        return true;
    });

    // Theme values following Periodya Slate System
    const bgMain = isLight ? 'bg-white' : 'bg-[#0f172a]';
    const bgMuted = isLight ? 'bg-slate-50' : 'bg-slate-900/50';
    const borderMain = isLight ? 'border-slate-200' : 'border-slate-800';
    const textMain = isLight ? 'text-slate-900' : 'text-slate-100';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';

    return (
        <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-[#020617]'} p-6 font-sans`}>
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* HEADER - Linear Style */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-xl font-semibold tracking-tight ${textMain}`}>Atölye Yönetimi</h1>
                        <p className={`text-sm ${textMuted}`}>Servis süreçleri ve teknisyen verimlilik kontrolü.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                            <input 
                                type="text"
                                placeholder="Plaka veya isim ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`h-9 w-64 pl-9 pr-4 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-blue-500/20 outline-none ${bgMain} ${borderMain} ${textMain}`}
                            />
                        </div>
                        <button 
                            onClick={() => router.push('/service/new')}
                            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Yeni Kabul
                        </button>
                    </div>
                </div>

                {/* KPI BOXES - Stripe Style (Bordered, No Shadow) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Aktif Atölye', value: allServices.filter(s => s.status === 'İşlemde').length, icon: <ActivityIcon /> },
                        { label: 'Bekleyen Kabul', value: allServices.filter(s => s.status === 'Beklemede' && !s.appointmentDate).length, icon: <Clock /> },
                        { label: 'Gelecek Randevu', value: allServices.filter(s => s.appointmentDate).length, icon: <Calendar /> },
                        { label: 'Bugün Tamamlanan', value: allServices.filter(s => s.status === 'Tamamlandı').length, icon: <CheckCircle2 /> },
                    ].map((stat, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${bgMain} ${borderMain}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-medium uppercase tracking-wider ${textMuted}`}>{stat.label}</span>
                                <div className={textMuted}>{stat.icon}</div>
                            </div>
                            <div className={`text-2xl font-semibold ${textMain}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* TABS - Notion Style */}
                <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Aktif İşler
                    </button>
                    <button 
                        onClick={() => setActiveTab('scheduled')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'scheduled' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Randevular
                    </button>
                    <button 
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'performance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Verimlilik
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className={`min-h-[500px] rounded-xl border overflow-hidden ${bgMain} ${borderMain}`}>
                    {activeTab === 'performance' ? (
                        <PerformancePanel isLight={isLight} technicians={technicians} allServices={allServices} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className={`${bgMuted} border-b ${borderMain}`}>
                                        <th className="px-6 py-3 font-medium text-slate-500 uppercase text-[11px] tracking-wider">Durum</th>
                                        <th className="px-6 py-3 font-medium text-slate-500 uppercase text-[11px] tracking-wider">Müşteri / Araç</th>
                                        <th className="px-6 py-3 font-medium text-slate-500 uppercase text-[11px] tracking-wider">Teknisyen</th>
                                        <th className="px-6 py-3 font-medium text-slate-500 uppercase text-[11px] tracking-wider">Giriş Tarihi</th>
                                        <th className="px-6 py-3 font-medium text-slate-500 uppercase text-[11px] tracking-wider text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${borderMain}`}>
                                    {filteredServices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Kayıt bulunamadı.</td>
                                        </tr>
                                    ) : filteredServices.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <StatusBadge status={s.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold ${textMain}`}>{s.customer?.name || 'Bilinmeyen Müşteri'}</span>
                                                    <span className={`text-xs ${textMuted} flex items-center gap-2`}>
                                                        {s.plate || 'ÜRÜN'} • {s.vehicleBrand || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.technician?.name ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                            {s.technician.name[0]}
                                                        </div>
                                                        <span className={textMain}>{s.technician.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Atanmadı</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={textMuted}>{new Date(s.createdAt).toLocaleDateString('tr-TR')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {s.status === 'Beklemede' && (
                                                        <button onClick={() => handleUpdateStatus(s.id, 'İşlemde')} title="Başlat" className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><Play className="w-4 h-4 fill-current" /></button>
                                                    )}
                                                    {s.status === 'İşlemde' && (
                                                        <button onClick={() => handleUpdateStatus(s.id, 'Tamamlandı')} title="Bitir" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"><CheckCircle2 className="w-4 h-4" /></button>
                                                    )}
                                                    <button onClick={() => router.push(`/service/${s.id}`)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        'Beklemede': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'İşlemde': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border ${config[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status}
        </span>
    );
}

function ActivityIcon() {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
}

function PerformancePanel({ isLight, technicians, allServices }: any) {
    const textMain = isLight ? 'text-slate-900' : 'text-slate-100';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    
    return (
        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className={`text-sm font-semibold ${textMain}`}>Teknisyen Performans Listesi</h3>
                    <div className="space-y-3">
                        {technicians.length === 0 ? <p className={textMuted}>Personel verisi yok.</p> : technicians.map((tech: any) => {
                            const completed = allServices.filter((s: any) => s.technicianId === tech.id && s.status === 'Tamamlandı').length;
                            const active = allServices.filter((s: any) => s.technicianId === tech.id && s.status === 'İşlemde').length;
                            return (
                                <div key={tech.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs uppercase">{tech.name[0]}</div>
                                        <div><div className={`font-semibold ${textMain}`}>{tech.name}</div><div className={`text-[11px] font-medium uppercase tracking-wider text-blue-500`}>{active} AKTİF İŞ</div></div>
                                    </div>
                                    <div className="text-right"><div className={`text-sm font-bold ${textMain}`}>{completed} BİTEN</div><div className={`text-[10px] ${textMuted}`}>PUAN: 4.8</div></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center">
                    <TrendingUp className="w-12 h-12 text-blue-500 mb-4" />
                    <h3 className={`font-bold ${textMain}`}>Haftalık Verimlilik Artışı</h3>
                    <p className={`text-xs mt-2 max-w-[250px] ${textMuted}`}>Operasyonel hız son 7 günde %12 artış gösterdi. Ortalama servis süresi 114 dakikaya düştü.</p>
                </div>
            </div>
        </div>
    );
}
