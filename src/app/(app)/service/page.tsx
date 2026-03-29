"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/contexts/ModalContext';
import { 
    Wrench, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    Search, 
    TrendingUp,
    Play,
    Plus,
    ChevronRight,
    Activity,
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

    // Theme Variables (Enterprise Light Mode Refinement)
    const bgApp = isLight ? 'bg-[#F7F8FA]' : 'bg-[#020617]';
    const bgMain = isLight ? 'bg-[#FFFFFF]' : 'bg-[#0f172a]';
    const bgMuted = isLight ? 'bg-[#F4F6F8]' : 'bg-slate-900/50';
    const bgHover = isLight ? 'hover:bg-[#ECEFF3]' : 'hover:bg-white/[0.04]';
    const borderMain = isLight ? 'border-[#E1E5EA]' : 'border-slate-800';
    const borderMuted = isLight ? 'border-[#EEF1F4]' : 'border-slate-900';
    const borderCard = isLight ? 'border-[#D9DEE5]' : 'border-slate-800';
    const textMain = isLight ? 'text-[#111827]' : 'text-slate-100';
    const textSecondary = isLight ? 'text-[#4B5563]' : 'text-slate-400';
    const textMuted = isLight ? 'text-[#9CA3AF]' : 'text-slate-500';

    return (
        <div className={`min-h-screen ${bgApp} p-6 font-sans transition-colors duration-300`}>
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-xl font-semibold tracking-tight ${textMain}`}>Atölye Yönetimi</h1>
                        <p className={`text-sm ${textSecondary}`}>Servis süreçleri ve teknisyen verimlilik kontrolü.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                            <input 
                                type="text"
                                placeholder="Plaka veya isim ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`h-9 w-64 pl-9 pr-4 rounded-lg border text-sm transition-all focus:ring-2 focus:ring-[#2563EB]/20 outline-none ${bgMain} ${isLight ? 'border-[#D6DAE1]' : borderMain} ${textMain}`}
                            />
                        </div>
                        <button 
                            onClick={() => router.push('/service/new')}
                            className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Yeni Kabul
                        </button>
                    </div>
                </div>

                {/* KPI BOXES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Aktif Atölye', value: allServices.filter(s => s.status === 'İşlemde').length, icon: <Activity className="w-4 h-4" /> },
                        { label: 'Bekleyen Kabul', value: allServices.filter(s => s.status === 'Beklemede' && !s.appointmentDate).length, icon: <Clock className="w-4 h-4" /> },
                        { label: 'Gelecek Randevu', value: allServices.filter(s => s.appointmentDate).length, icon: <Calendar className="w-4 h-4" /> },
                        { label: 'Bugün Tamamlanan', value: allServices.filter(s => s.status === 'Tamamlandı').length, icon: <CheckCircle2 className="w-4 h-4" /> },
                    ].map((stat, i) => (
                        <div key={i} className={`p-4 rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[11px] font-semibold uppercase tracking-wider ${textSecondary}`}>{stat.label}</span>
                                <div className={textMuted}>{stat.icon}</div>
                            </div>
                            <div className={`text-2xl font-semibold ${textMain}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* TABS */}
                <div className={`flex items-center gap-1 border-b ${isLight ? 'border-[#ECEFF3]' : 'border-slate-800'}`}>
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'active' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Aktif İşler
                    </button>
                    <button 
                        onClick={() => setActiveTab('scheduled')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'scheduled' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Randevular
                    </button>
                    <button 
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'performance' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Verimlilik
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className={`min-h-[500px] rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden ${bgMain} ${borderCard}`}>
                    {activeTab === 'performance' ? (
                        <PerformancePanel isLight={isLight} technicians={technicians} allServices={allServices} textMain={textMain} textSecondary={textSecondary} textMuted={textMuted} bgMuted={bgMuted} borderMain={borderMain} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className={`${bgMuted} border-b ${borderMain}`}>
                                        <th className={`px-6 py-3 font-medium text-[11px] uppercase tracking-wider ${textSecondary}`}>Durum</th>
                                        <th className={`px-6 py-3 font-medium text-[11px] uppercase tracking-wider ${textSecondary}`}>Müşteri / Araç</th>
                                        <th className={`px-6 py-3 font-medium text-[11px] uppercase tracking-wider ${textSecondary}`}>Teknisyen</th>
                                        <th className={`px-6 py-3 font-medium text-[11px] uppercase tracking-wider ${textSecondary}`}>Giriş Tarihi</th>
                                        <th className={`px-6 py-3 font-medium text-[11px] uppercase tracking-wider text-right ${textSecondary}`}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${borderMuted}`}>
                                    {filteredServices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Kayıt bulunamadı.</td>
                                        </tr>
                                    ) : filteredServices.map((s) => (
                                        <tr key={s.id} className={`${bgHover} transition-colors group`}>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={s.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold ${textMain}`}>{s.customer?.name || 'Bilinmeyen Müşteri'}</span>
                                                    <span className={`text-xs flex items-center gap-2 ${textSecondary}`}>
                                                        {s.plate || 'ÜRÜN'} • {s.vehicleBrand || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.technician?.name ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${isLight ? 'bg-[#E9EDF2] text-[#4B5563]' : 'bg-slate-700 text-slate-500'}`}>
                                                            {s.technician.name[0]}
                                                        </div>
                                                        <span className={textMain}>{s.technician.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Atanmadı</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={textSecondary}>{new Date(s.createdAt).toLocaleDateString('tr-TR')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {s.status === 'Beklemede' && (
                                                        <button onClick={() => handleUpdateStatus(s.id, 'İşlemde')} title="Başlat" className={`p-1.5 rounded-md ${isLight ? 'text-[#027A48] hover:bg-[#ECFDF3]' : 'text-emerald-500 hover:bg-emerald-500/10'}`}><Play className="w-4 h-4 fill-current" /></button>
                                                    )}
                                                    {s.status === 'İşlemde' && (
                                                        <button onClick={() => handleUpdateStatus(s.id, 'Tamamlandı')} title="Bitir" className={`p-1.5 rounded-md ${isLight ? 'text-[#175CD3] hover:bg-[#EFF8FF]' : 'text-blue-500 hover:bg-blue-500/10'}`}><CheckCircle2 className="w-4 h-4" /></button>
                                                    )}
                                                    <button onClick={() => router.push(`/service/${s.id}`)} className={`p-1.5 rounded-md ${isLight ? 'text-[#4B5563] hover:bg-[#ECEFF3]' : 'text-slate-400 hover:bg-slate-800'}`}><ChevronRight className="w-4 h-4" /></button>
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
        'Beklemede': 'bg-[#FFFAEB] text-[#B54708] border-[#FFFAEB] dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
        'İşlemde': 'bg-[#EFF8FF] text-[#175CD3] border-[#EFF8FF] dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        'Tamamlandı': 'bg-[#ECFDF3] text-[#027A48] border-[#ECFDF3] dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border ${config[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
        </span>
    );
}

function PerformancePanel({ isLight, technicians, allServices, textMain, textSecondary, textMuted, bgMuted, borderMain }: any) {
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
                                <div key={tech.id} className={`p-4 rounded-lg border flex justify-between items-center ${bgMuted} ${isLight ? 'border-[#E1E5EA]' : borderMain}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs uppercase">{tech.name[0]}</div>
                                        <div><div className={`font-semibold ${textMain}`}>{tech.name}</div><div className={`text-[11px] font-medium uppercase tracking-wider text-[#175CD3]`}>{active} AKTİF İŞ</div></div>
                                    </div>
                                    <div className="text-right"><div className={`text-sm font-bold ${textMain}`}>{completed} BİTEN</div><div className={`text-[10px] ${textSecondary}`}>PUAN: 4.8</div></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${bgMuted} ${isLight ? 'border-[#E1E5EA]' : borderMain}`}>
                    <TrendingUp className="w-12 h-12 text-[#2563EB] mb-4" />
                    <h3 className={`font-bold ${textMain}`}>Haftalık Verimlilik Artışı</h3>
                    <p className={`text-xs mt-2 max-w-[250px] ${textSecondary}`}>Operasyonel hız son 7 günde %12 artış gösterdi. Ortalama servis süresi 114 dakikaya düştü.</p>
                </div>
            </div>
        </div>
    );
}
