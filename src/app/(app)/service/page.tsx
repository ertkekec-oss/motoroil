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
    MapPin, 
    Printer, 
    AlertTriangle, 
    X, 
    ChevronRight, 
    Search, 
    Filter,
    Activity,
    Users,
    TrendingUp,
    Play
} from 'lucide-react';
import { Sheet, Button } from '@/components/ui/enterprise';

export default function ServiceDashboard() {
    const { currentUser, hasPermission, hasFeature } = useApp();
    const router = useRouter();
    const { theme } = useTheme();
    const { showSuccess, showError } = useModal();
    const isLight = theme === 'light';

    const [activeServiceTab, setActiveServiceTab] = useState<'jobs' | 'calendar' | 'performance'>('jobs');
    const [activeJobs, setActiveJobs] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!hasFeature('service_desk') && currentUser !== null) {
            router.push('/billing?upsell=service_desk');
        }
    }, [hasFeature, currentUser, router]);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            if (data.success) {
                const all = data.services || [];
                setActiveJobs(all.filter((j: any) => j.status !== 'Teslim Edildi' && j.status !== 'İptal Edildi'));
                setAppointments(all.filter((j: any) => j.status === 'Beklemede' && j.appointmentDate));
            }
        } catch (error) { console.error("Service fetch error", error); }
        finally { setIsLoading(false); }
    };

    const fetchTechnicians = async () => {
        try {
            const res = await fetch('/api/staff');
            const data = await res.json();
            if (data.success) {
                setTechnicians(data.staff.filter((s: any) => s.type === 'service' || s.role === 'service' || !s.role));
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchServices();
        fetchTechnicians();
        const intv = setInterval(fetchServices, 45000);
        return () => clearInterval(intv);
    }, []);

    const handleUpdateServiceStatus = async (jobId: string, newStatus: string) => {
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
                showSuccess('Başarılı', `İş emri durumu "${newStatus}" olarak güncellendi.`);
                fetchServices();
            }
        } catch (error) { showError('Hata', 'Durum güncellenemedi.'); }
    };

    const stats = [
        { label: 'Aktif Atölye', value: activeJobs.filter(j => j.status === 'İşlemde').length, unit: 'İş Emri', icon: <Activity size={18} />, color: 'blue' },
        { label: 'Bekleyen Kabul', value: activeJobs.filter(j => j.status === 'Beklemede').length, unit: 'Kayıt', icon: <Clock size={18} />, color: 'amber' },
        { label: 'Bugün Biten', value: activeJobs.filter(j => j.status === 'Tamamlandı').length, unit: 'Araç', icon: <CheckCircle2 size={18} />, color: 'emerald' },
        { label: 'Randevular', value: appointments.length, unit: 'Gelecek', icon: <Calendar size={18} />, color: 'indigo' },
    ];

    const cardBg = isLight ? 'bg-white border-slate-200' : 'bg-[#111827] border-white/5';
    const softBg = isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/[0.02] border-white/5';
    const textMain = isLight ? 'text-slate-900' : 'text-white';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const pageBg = isLight ? 'bg-[#f8fafc]' : 'bg-[#030712]';

    return (
        <div data-pos-theme={theme} className={`${pageBg} min-h-screen p-4 sm:p-8 font-sans transition-colors duration-300`}>
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* ADVANCED HEADER */}
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-slate-200 text-blue-600' : 'bg-blue-600/10 border-blue-600/20 text-blue-400'}`}>
                            <Wrench size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Atölye Komuta Merkezi</h1>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>ONLINE</span>
                            </div>
                            <p className={`text-[12px] font-bold uppercase tracking-[0.3em] mt-1 opacity-40 ${textMuted}`}>Real-time Atölye ve Verimlilik Yönetimi</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                        <div className={`relative flex-1 sm:flex-none sm:w-[300px]`}>
                            <input 
                                type="text" 
                                placeholder="Plaka, İsim veya İş Emri Ara..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full h-11 px-11 rounded-2xl border text-[13px] font-bold outline-none transition-all ${isLight ? 'bg-white border-slate-200 focus:border-blue-500' : 'bg-white/5 border-white/10 focus:border-blue-500/50 text-white'}`}
                            />
                            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted} opacity-30`} />
                        </div>
                        
                        <div className={`h-11 px-4 rounded-2xl border flex items-center gap-3 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <Users size={16} className="text-blue-500" />
                            <span className={`text-[11px] font-black uppercase tracking-widest ${textMain}`}>{technicians.length} Teknisyen</span>
                        </div>

                        <button 
                            onClick={() => router.push('/service/new')}
                            className={`flex-1 sm:flex-none h-11 px-6 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3`}
                        >
                            <Play size={14} className="fill-current" /> Yeni Kayıt GİRİŞİ
                        </button>
                    </div>
                </header>

                {/* HIGH-DENSITY KPI GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[32px] border relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${cardBg} shadow-sm`}>
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 bg-current flex items-center justify-center p-8`}>{stat.icon}</div>
                            <div className="flex flex-col gap-1 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${textMain}`}>{stat.label}</span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className={`text-4xl font-black tracking-tighter ${textMain}`}>{stat.value}</span>
                                    <span className={`text-[11px] font-black uppercase tracking-widest opacity-20 ${textMain}`}>{stat.unit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DYNAMIC DASHBOARD CONTENT */}
                <div className="space-y-6">
                    {/* TABS CONSOLE */}
                    <div className={`flex items-center gap-2 p-1.5 rounded-3xl border w-fit ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <button onClick={() => setActiveServiceTab('jobs')} className={`px-6 h-10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeServiceTab === 'jobs' ? (isLight ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'bg-blue-600 text-white shadow-lg') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/60')}`}>
                            ATÖLYE KANBAN {activeJobs.length > 0 && <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeServiceTab === 'jobs' ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-white/20 text-white') : (isLight ? 'bg-slate-200 text-slate-400' : 'bg-white/5 text-white/20')}`}>{activeJobs.length}</span>}
                        </button>
                        <button onClick={() => setActiveServiceTab('calendar')} className={`px-6 h-10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeServiceTab === 'calendar' ? (isLight ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'bg-blue-600 text-white shadow-lg') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/60')}`}>RANDEVU TAKVİMİ</button>
                        <button onClick={() => setActiveServiceTab('performance')} className={`px-6 h-10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeServiceTab === 'performance' ? (isLight ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'bg-blue-600 text-white shadow-lg') : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/60')}`}>
                            <TrendingUp size={14} /> VERİMLİLİK
                        </button>
                    </div>

                    <div className={`rounded-[40px] border shadow-2xl overflow-hidden min-h-[600px] ${cardBg} backdrop-blur-3xl`}>
                        {activeServiceTab === 'jobs' ? (
                            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* -- KANBAN COLUMNS -- */}
                                {['Beklemede', 'İşlemde', 'Tamamlandı'].map((status) => (
                                    <div key={status} className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between px-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${status === 'Beklemede' ? 'bg-amber-500' : status === 'İşlemde' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] ${textMain}`}>{status === 'Beklemede' ? 'Bekleyen Kabul' : status === 'İşlemde' ? 'Şu An İşlemde' : 'Tamamlanan İşler'}</h3>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/20'}`}>
                                                {activeJobs.filter(j => j.status === status).length} ARAÇ
                                            </span>
                                        </div>
                                        <div className="space-y-4 flex-1">
                                            {activeJobs.filter(j => j.status === status).length === 0 ? (
                                                <div className={`h-[200px] rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center ${isLight ? 'border-slate-100' : 'border-white/5 opacity-20'}`}>
                                                    <div className="text-4xl mb-4">📭</div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">BU KATEGORİ BOŞ</span>
                                                </div>
                                            ) : (
                                                activeJobs.filter(j => j.status === status).map((job) => (
                                                    <div key={job.id} onClick={() => router.push(`/service/${job.id}`)} className={`group p-5 rounded-[28px] border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden ${isLight ? 'bg-white hover:border-blue-500 shadow-sm' : 'bg-white/[0.03] border-white/5 hover:border-blue-500/50 hover:bg-white/[0.05]'}`}>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex flex-col">
                                                                <span className={`text-[15px] font-black tracking-tight ${textMain}`}>{job.vehicleBrand || 'Tanımsız Ürün'}</span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest text-blue-500 mt-1`}>SRV-{job.id.slice(-6).toUpperCase()}</span>
                                                            </div>
                                                            <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-black tracking-widest ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/10 border-white/10 text-white'}`}>{job.plate || 'NO-PLATE'}</div>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-600 text-white'}`}>{job.technician?.name?.[0] || 'A'}</div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[12px] font-bold ${textMain}`}>{job.technician?.name || 'Veli Tayin Edilmedi'}</span>
                                                                    <span className={`text-[9px] font-bold uppercase tracking-widest opacity-30 ${textMain}`}>OPERASYON SORUMLUSU</span>
                                                                </div>
                                                            </div>
                                                            {status === 'Beklemede' && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateServiceStatus(job.id, 'İşlemde'); }} className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"><Play size={16} fill="currentColor" /></button>
                                                            )}
                                                            {status === 'İşlemde' && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateServiceStatus(job.id, 'Tamamlandı'); }} className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-90 transition-all"><CheckCircle2 size={18} strokeWidth={3} /></button>
                                                            )}
                                                            {status === 'Tamamlandı' && (
                                                                <ChevronRight size={20} className={`opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${textMain}`} />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeServiceTab === 'calendar' ? (
                            <div className="p-8">
                                <div className={`rounded-3xl border overflow-hidden ${softBg}`}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                                <th className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest ${textMuted}`}>PLANLANAN ZAMAN</th>
                                                <th className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest ${textMuted}`}>MÜŞTERİ & ÜRÜN</th>
                                                <th className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest ${textMuted}`}>KONU</th>
                                                <th className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest text-right ${textMuted}`}>EYLEM</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                                            {appointments.map(app => (
                                                <tr key={app.id} className={`group hover:bg-white/[0.04] transition-all`}>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className={`text-[15px] font-black ${textMain}`}>{new Date(app.appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span className={`text-[11px] font-bold uppercase tracking-widest mt-1 opacity-30 ${textMain}`}>{new Date(app.appointmentDate).toLocaleDateString('tr-TR')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className={`text-[14px] font-black ${textMain}`}>{app.customer?.name}</span>
                                                            <span className={`text-[12px] font-bold text-blue-500 mt-0.5`}>{app.vehicleBrand} • {app.plate || 'SERI NO'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest w-fit ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10 opacity-60'}`}>{app.notes || 'Genel Bakım'}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button onClick={() => handleUpdateServiceStatus(app.id, 'İşlemde')} className="px-6 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">ATÖLYEYE AL</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {appointments.length === 0 && (
                                                <tr><td colSpan={4} className="py-24 text-center"><div className="text-4xl mb-4">🗓️</div><div className={`text-[12px] font-black uppercase tracking-widest opacity-20 ${textMain}`}>Bugün için planlanmış randevu bulunmuyor</div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className={`w-24 h-24 rounded-[32px] mb-8 flex items-center justify-center shadow-2xl border ${isLight ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-600/10 border-blue-600/20 text-blue-400'}`}>
                                    <TrendingUp size={48} />
                                </div>
                                <h3 className={`text-2xl font-black tracking-tight mb-4 ${textMain}`}>Atölye Verimlilik Raporu</h3>
                                <p className={`max-w-md text-[14px] font-bold leading-relaxed opacity-40 ${textMain}`}>Bu modül şu anda veri toplama aşamasındadır. Teknisyen performansları ve ortalama işlem süreleri 24 saat içerisinde burada grafiksel olarak sunulacaktır.</p>
                                <div className="mt-12 grid grid-cols-3 gap-8 w-full max-w-2xl">
                                    <div className="flex flex-col gap-2">
                                        <div className={`text-3xl font-black ${textMain}`}>%92</div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${textMain}`}>MÜŞTERİ MEMNUNİYETİ</div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className={`text-3xl font-black ${textMain}`}>1.2 s</div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${textMain}`}>ORT. İŞLEM SÜRESİ</div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className={`text-3xl font-black ${textMain}`}>₺145k</div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${textMain}`}>BU AYKİ VERİM</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
