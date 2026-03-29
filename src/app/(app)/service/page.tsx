"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Pagination from '@/components/Pagination';
import { Wrench, Calendar, FileText, CheckCircle2, Clock, MapPin, Printer, AlertTriangle, X, ChevronRight } from 'lucide-react';

export default function ServiceDashboard() {
    const { currentUser, hasPermission, hasFeature } = useApp();
    const router = useRouter();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        if (!hasFeature('service_desk') && currentUser !== null) {
            router.push('/billing?upsell=service_desk');
        }
        if (currentUser && currentUser.role?.toUpperCase() !== 'SUPER_ADMIN' && currentUser.role?.toUpperCase() !== 'ADMIN' && currentUser.type !== 'service') {
            router.push('/');
        }
    }, [hasFeature, currentUser, router]);

    const isSystemAdmin = currentUser?.role?.toUpperCase() === 'ADMIN' || currentUser?.role?.toUpperCase() === 'SUPER_ADMIN' || currentUser?.role?.toUpperCase() === 'PLATFORM_ADMIN';

    const [activeServiceTab, setActiveServiceTab] = useState<'jobs' | 'calendar' | 'performance'>('jobs');
    const [activeBranchName, setActiveBranchName] = useState<string>('Merkez');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [activeJobs, setActiveJobs] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            if (data.success) {
                const all = data.services || [];
                setActiveJobs(all.filter((j: any) => j.status !== 'Tamamlandı' && j.status !== 'Teslim Edildi' && j.status !== 'İptal Edildi'));
                setAppointments(all.filter((j: any) => j.status === 'Beklemede'));
            }
        } catch (error) { console.error("Service fetch error", error); }
        finally { setIsLoading(false); }
    };

    const fetchTechnicians = async () => {
        try {
            const res = await fetch('/api/staff');
            const data = await res.json();
            if (data.success) {
                setTechnicians(data.staff.filter((s: any) => s.type === 'service'));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (currentUser?.branch) setActiveBranchName(currentUser.branch);
    }, [currentUser]);

    useEffect(() => {
        fetchServices();
        fetchTechnicians();
        const intv = setInterval(fetchServices, 45000);
        return () => clearInterval(intv);
    }, []);

    const handleUpdateService = async (jobId: string, payload: any) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/services/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                if (selectedService?.id === jobId) {
                    setSelectedService({ ...selectedService, ...data.service });
                }
                fetchServices();
            } else {
                alert("İşlem yapılamadı: " + data.error);
            }
        } catch (error) { console.error("Update service error", error); }
        finally { setIsUpdating(false); }
    };

    const handleStartService = (jobId: string) => {
        handleUpdateService(jobId, { status: 'İşlemde', startTime: new Date().toISOString() });
    };

    const handleCompleteService = (jobId: string) => {
        handleUpdateService(jobId, { status: 'Tamamlandı', endTime: new Date().toISOString() });
    };

    const handleAssignTechnician = (jobId: string, technicianId: string) => {
        handleUpdateService(jobId, { technicianId });
    };

    const filteredJobs = !hasPermission('branch_isolation') || isSystemAdmin
        ? activeJobs
        : activeJobs.filter((j: any) => (j.branch || 'Merkez') === (currentUser?.branch || 'Merkez'));

    const filteredAppointments = !hasPermission('branch_isolation') || isSystemAdmin
        ? appointments
        : appointments.filter((a: any) => (a.branch || 'Merkez') === (currentUser?.branch || 'Merkez'));

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => { setCurrentPage(1); }, [activeServiceTab]);

    const paginate = (list: any[]) => {
        if (!list) return [];
        return list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    };

    const currentList = activeServiceTab === 'jobs' ? filteredJobs : filteredAppointments;
    const totalPages = Math.ceil((currentList?.length || 0) / itemsPerPage);

    const serviceHistoryDetails = {
        'SRV-892': {
            parts: [
                { name: 'Motul 7100 10W40', qty: 3, price: 450 },
                { name: 'Yağ Filtresi', qty: 1, price: 180 }
            ],
            labor: 'Periyodik Bakım + Zincir Ayarı',
            laborPrice: 750,
            notes: 'Müşteri rölanti düşüklüğünden şikayetçi. Gaz kelebeği temizlenecek.',
            nextMaintenance: '34,500 KM / 24.07.2026'
        }
    };

    const cardBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/5';
    const softBg = isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/[0.02] border-white/5';
    const textMain = isLight ? 'text-slate-900' : 'text-white';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const pageBg = isLight ? 'min-h-screen bg-[#fafafa]' : 'min-h-screen bg-[#0f172a]';

    return (
        <div data-pos-theme={theme} className={`${pageBg} p-8 font-sans transition-colors duration-300`}>
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm border ${isLight ? 'bg-white border-slate-200 text-blue-600' : 'bg-white/5 border-white/10 text-blue-400'}`}>
                            <Wrench size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className={`text-[28px] font-bold tracking-tight ${textMain}`}>TechOPs Servis Masası</h1>
                            <p className={`text-[13px] font-medium leading-none mt-1 ${textMuted}`}>Operasyonel İzleme ve Atölye Yönetimi</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isSystemAdmin && (
                            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-widest`}>
                                <MapPin size={10} /> {activeBranchName} Şubesi
                            </div>
                        )}
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-[999px] border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>Kapasite Kullanımı</span>
                            <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <span className="text-[12px] font-bold text-blue-500">%65</span>
                        </div>
                        <button onClick={() => router.push('/service/new')} className={`px-5 py-2.5 rounded-[12px] text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                            <Wrench size={14} /> <span>Yeni Kayıt</span>
                        </button>
                    </div>
                </header>

                {/* --- KPI CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {[
                        { label: 'Açık İş Emri', value: filteredJobs.length, unit: 'Araç', icon: <FileText size={18} />, color: 'blue' },
                        { label: 'Bugün Tamamlanan', value: activeJobs.filter(j => j.status === 'Tamamlandı').length, unit: 'Araç', icon: <CheckCircle2 size={18} />, color: 'emerald' },
                        { label: 'Bekleyen Randevu', value: appointments.length, unit: 'Randevu', icon: <Calendar size={18} />, color: 'amber' },
                        { label: 'Tahmini Teslimat', value: '2s 15d', unit: '', icon: <Clock size={18} />, color: 'slate' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[24px] border shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all hover:-translate-y-1 ${cardBg}`}>
                            <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-150 duration-700`}>{stat.icon}</div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    {stat.icon}
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{stat.label}</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className={`text-[34px] font-[900] leading-none tracking-tighter ${textMain}`}>{stat.value}</span>
                                <span className={`text-[12px] font-bold uppercase opacity-40 ${textMuted}`}>{stat.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- TABS --- */}
                <div className={`inline-flex p-1 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                    <button onClick={() => setActiveServiceTab('jobs')} className={`px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeServiceTab === 'jobs' ? (isLight ? 'bg-white text-blue-600 shadow-md' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}>
                        Atölye (Aktif) {filteredJobs.length > 0 && <span className={`px-2 py-0.5 rounded-md text-[10px] ${activeServiceTab === 'jobs' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-400'}`}>{filteredJobs.length}</span>}
                    </button>
                    <button onClick={() => setActiveServiceTab('calendar')} className={`px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeServiceTab === 'calendar' ? (isLight ? 'bg-white text-blue-600 shadow-md' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}>Randevular</button>
                    <button onClick={() => setActiveServiceTab('performance')} className={`px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeServiceTab === 'performance' ? (isLight ? 'bg-white text-blue-600 shadow-md' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}>Analitik</button>
                </div>

                {/* --- TABLE CONTENT --- */}
                <div className={`rounded-[32px] border shadow-2xl overflow-hidden ${cardBg} backdrop-blur-xl`}>
                    {activeServiceTab === 'jobs' ? (
                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* -- PENDING COLUMN -- */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                            <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] ${textMain}`}>Beklemede</h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isLight ? 'bg-slate-200 text-slate-500' : 'bg-white/5 text-white/30'}`}>
                                            {activeJobs.filter(j => j.status === 'Beklemede').length}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {activeJobs.filter(j => j.status === 'Beklemede').length === 0 ? (
                                            <div className={`p-12 text-center rounded-[24px] border-2 border-dashed ${isLight ? 'border-slate-200 text-slate-400' : 'border-white/5 text-white/10'}`}>
                                                <div className="text-3xl mb-3">⏳</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest">Bekleyen İş Yok</div>
                                            </div>
                                        ) : (
                                            activeJobs.filter(j => j.status === 'Beklemede').map((job) => (
                                                <KanbanCard key={job.id} job={job} isLight={isLight} textMain={textMain} textMuted={textMuted} cardBg={cardBg} router={router} onStart={() => handleStartService(job.id)} />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* -- IN PROGRESS COLUMN -- */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse"></div>
                                            <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] ${textMain}`}>İşlemde</h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {activeJobs.filter(j => j.status === 'İşlemde').length}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {activeJobs.filter(j => j.status === 'İşlemde').length === 0 ? (
                                            <div className={`p-12 text-center rounded-[24px] border-2 border-dashed ${isLight ? 'border-blue-100 text-blue-200' : 'border-blue-500/5 text-blue-500/10'}`}>
                                                <div className="text-3xl mb-3">🛠️</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest">Aktif İşlem Yok</div>
                                            </div>
                                        ) : (
                                            activeJobs.filter(j => j.status === 'İşlemde').map((job) => (
                                                <KanbanCard key={job.id} job={job} isLight={isLight} textMain={textMain} textMuted={textMuted} cardBg={cardBg} router={router} isActive />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* -- COMPLETED COLUMN -- */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] ${textMain}`}>Tamamlandı</h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isLight ? 'bg-emerald-50 text-emerald-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {activeJobs.filter(j => j.status === 'Tamamlandı').length}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {activeJobs.filter(j => j.status === 'Tamamlandı').length === 0 ? (
                                            <div className={`p-12 text-center rounded-[24px] border-2 border-dashed ${isLight ? 'border-emerald-100 text-emerald-200' : 'border-emerald-500/5 text-emerald-500/10'}`}>
                                                <div className="text-3xl mb-3">✅</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest">Biten İş Yok</div>
                                            </div>
                                        ) : (
                                            activeJobs.filter(j => j.status === 'Tamamlandı').slice(0, 10).map((job) => (
                                                <KanbanCard key={job.id} job={job} isLight={isLight} textMain={textMain} textMuted={textMuted} cardBg={cardBg} router={router} isDone />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeServiceTab === 'performance' ? (
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Service Volume Chart Placeholder / Stats */}
                                <div className={`col-span-2 p-8 rounded-[24px] border ${softBg}`}>
                                    <h3 className={`text-[15px] font-bold mb-6 ${textMain}`}>Teknisyen İş Hacmi</h3>
                                    <div className="space-y-6">
                                        {technicians.map((tech) => {
                                            const techJobs = activeJobs.filter(j => j.technicianId === tech.id);
                                            const completed = techJobs.filter(j => j.status === 'Tamamlandı').length;
                                            const total = techJobs.length;
                                            const percentage = total > 0 ? (completed / total) * 100 : 0;
                                            
                                            return (
                                                <div key={tech.id} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-[13px] font-semibold ${textMain}`}>{tech.name}</span>
                                                        <span className={`text-[12px] font-medium ${textMuted}`}>{completed} / {total} İş Tamamlandı</span>
                                                    </div>
                                                    <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                                        <div 
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {technicians.length === 0 && (
                                            <div className={`text-center py-12 ${textMuted} italic`}>Henüz aktif teknisyen kaydı bulunmuyor.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Stats Panel */}
                                <div className="space-y-6">
                                    <div className={`p-6 rounded-[24px] border ${softBg}`}>
                                        <h4 className={`text-[11px] font-black uppercase tracking-widest mb-4 ${textMuted}`}>Genel Verimlilik</h4>
                                        <div className={`text-3xl font-bold ${textMain}`}>%84.2</div>
                                        <p className={`text-[11px] mt-1 ${textMuted}`}>Hedeflenen: %85.0</p>
                                    </div>
                                    <div className={`p-6 rounded-[24px] border ${softBg}`}>
                                        <h4 className={`text-[11px] font-black uppercase tracking-widest mb-4 ${textMuted}`}>Ortalama İş Süresi</h4>
                                        <div className={`text-3xl font-bold ${textMain}`}>2s 14dk</div>
                                        <p className={`text-[11px] mt-1 ${textMuted}`}>Son 7 gün ortalaması</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className={`p-5 flex justify-between items-center border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-white/[0.02]'}`}>
                                <h3 className={`text-[14px] font-semibold ${textMain}`}>Gelecek Randevular</h3>
                                <button className={`px-4 py-2 rounded-[10px] text-[12px] font-medium transition-all ${isLight ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}>
                                    + Randevu Oluştur
                                </button>
                            </div>
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>Zamanlama</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>Müşteri</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>Araç Bildirimi</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>İşlem Türü</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase text-right ${textMuted}`}>Durum</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                                    {filteredAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className={`w-12 h-12 flex items-center justify-center rounded-full ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'}`}>
                                                        <Calendar size={24} />
                                                    </div>
                                                    <div className={`text-[14px] font-medium ${textMuted}`}>Bugün için bekleyen randevu bulunmuyor.</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginate(filteredAppointments).map((app: any) => (
                                            <tr key={app.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[14px] font-semibold ${textMain}`}>{app.appointmentDate ? new Date(app.appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Belirsiz'}</span>
                                                        <span className={`text-[12px] font-medium mt-0.5 ${textMuted}`}>{app.appointmentDate ? new Date(app.appointmentDate).toLocaleDateString('tr-TR') : 'Müşteri Geldiğinde'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[14px] font-medium ${textMain}`}>{app.customer?.name || 'Bilinmeyen Müşteri'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[13px] font-medium ${textMain}`}>{app.vehicleBrand || 'Belirtilmemiş'}</span>
                                                        <span className={`text-[11px] font-mono tracking-wider mt-0.5 ${textMuted}`}>{app.plate || 'PLAKASIZ'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-[6px] text-[11px] font-medium border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                                        {app.items?.length > 0 ? `${app.items.length} Kalem Bakım` : 'Genel Kontrol'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleStartService(app.id)}
                                                            className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-all ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                                        >
                                                            Atölyeye Al
                                                        </button>
                                                        <button className={`h-[32px] px-3 rounded-[8px] border text-[12px] font-medium transition-all ${isLight ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-red-500/20 text-red-400 hover:bg-red-500/10'}`}>
                                                            İptal
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div className={`p-4 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- SERVICE DETAIL MODAL --- */}
            {selectedService && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6  animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/40' : 'bg-slate-900/60'}`}>
                    <div className={`w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[24px] border shadow-2xl relative flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                        {/* Modal Header */}
                        <div className={`p-6 flex justify-between items-start sticky top-0 z-10 border-b  ${isLight ? 'bg-white dark:bg-slate-900 border-slate-200' : 'bg-[#0f172a]/95 border-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shadow-sm border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className={`text-[20px] font-bold tracking-tight ${textMain}`}>Servis Kaydı Detayı</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[13px] font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>#{selectedService.id.slice(-6).toUpperCase()}</span>
                                        <div className={`w-1 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`}></div>
                                        <span className={`text-[12px] font-medium ${textMuted}`}>{new Date(selectedService.createdAt).toLocaleDateString('tr-TR')} Giriş Yapıldı</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedService(null)}
                                className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all ${isLight ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Card 1 */}
                                <div className={`p-5 rounded-[16px] border ${softBg}`}>
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide mb-3 block ${textMuted}`}>Araç & Müşteri</label>
                                    <div className={`text-[16px] font-bold ${textMain} mb-1`}>{selectedService.vehicleBrand} {selectedService.vehicleSerial || ''}</div>
                                    <div className={`text-[13px] font-medium ${isLight ? 'text-blue-600' : 'text-blue-400'} mb-3`}>Plaka: {selectedService.plate || 'PLAKASIZ'}</div>
                                    <div className={`flex items-center gap-2 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                        <div className={`p-1.5 rounded-md ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
                                            <MapPin size={12} />
                                        </div>
                                        <span className={`text-[13px] font-medium ${textMain}`}>{selectedService.customer?.name || 'Bilinmeyen Müşteri'}</span>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className={`p-5 rounded-[16px] border ${softBg}`}>
                                    <label className={`text-[11px] font-semibold uppercase tracking-wide mb-3 block ${textMuted}`}>Teknik Bilgiler</label>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[13px] font-medium ${textMuted}`}>Mevcut Kilometre</span>
                                            <span className={`text-[14px] font-semibold ${textMain}`}>{(selectedService.km || 0).toLocaleString()} KM</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[13px] font-medium ${textMuted}`}>Sorumlu Teknisyen</span>
                                            <select
                                                value={selectedService.technicianId || ''}
                                                onChange={(e) => handleAssignTechnician(selectedService.id, e.target.value)}
                                                className={`text-[13px] font-semibold outline-none bg-transparent ${textMain} text-right min-w-[120px] cursor-pointer`}
                                            >
                                                <option value="" className={isLight ? 'text-slate-900' : 'text-slate-900'}>Personel Seç</option>
                                                {technicians.map((t: any) => (
                                                    <option key={t.id} value={t.id} className={isLight ? 'text-slate-900' : 'text-slate-900'}>
                                                        {t.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={`flex items-center justify-between pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                            <span className={`text-[13px] font-medium ${textMuted}`}>Durum</span>
                                            <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wider ${
                                                selectedService.status === 'Tamamlandı' ? (isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400') :
                                                selectedService.status === 'İşlemde' ? (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400') :
                                                (isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400')
                                            }`}>
                                                {selectedService.status}
                                            </span>
                                        </div>
                                        {(selectedService.startTime || selectedService.endTime) && (
                                            <div className="pt-3 border-t border-dashed border-white/5 space-y-1">
                                                {selectedService.startTime && (
                                                    <div className="flex justify-between items-center text-[11px]">
                                                        <span className={textMuted}>Başlangıç:</span>
                                                        <span className={textMain}>{new Date(selectedService.startTime).toLocaleString('tr-TR')}</span>
                                                    </div>
                                                )}
                                                {selectedService.endTime && (
                                                    <div className="flex justify-between items-center text-[11px]">
                                                        <span className={textMuted}>Bitiş:</span>
                                                        <span className={textMain}>{new Date(selectedService.endTime).toLocaleString('tr-TR')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="space-y-3">
                                <label className={`text-[11px] font-semibold uppercase tracking-wide ml-1 ${textMuted}`}>Yapılan İşlemler & Parçalar</label>
                                <div className={`rounded-[16px] border overflow-hidden shadow-sm ${cardBg}`}>
                                    {(serviceHistoryDetails as any)[selectedService.id] ? (
                                        <table className="w-full text-left border-collapse">
                                            <thead className={`border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/5'}`}>
                                                <tr>
                                                    <th className={`px-5 py-3 text-[11px] font-medium uppercase tracking-wide ${textMuted}`}>Kalem Adı</th>
                                                    <th className={`px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-center ${textMuted}`}>Miktar</th>
                                                    <th className={`px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-right ${textMuted}`}>Tutar</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                                                {(serviceHistoryDetails as any)[selectedService.id].parts.map((p: any, i: number) => (
                                                    <tr key={i} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}`}>
                                                        <td className={`px-5 py-3 text-[13px] font-medium ${textMain}`}>{p.name}</td>
                                                        <td className={`px-5 py-3 text-[13px] font-medium text-center ${textMuted}`}>{p.qty}</td>
                                                        <td className={`px-5 py-3 text-[13px] font-medium text-right ${textMain}`}>₺ {p.price * p.qty}</td>
                                                    </tr>
                                                ))}
                                                <tr className={isLight ? 'bg-blue-50' : 'bg-blue-500/5'}>
                                                    <td className={`px-5 py-3 text-[13px] font-semibold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>{(serviceHistoryDetails as any)[selectedService.id].labor}</td>
                                                    <td className={`px-5 py-3 text-[13px] font-medium text-center ${isLight ? 'text-blue-600/70' : 'text-blue-400/70'}`}>1</td>
                                                    <td className={`px-5 py-3 text-[13px] font-semibold text-right ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>₺ {(serviceHistoryDetails as any)[selectedService.id].laborPrice}</td>
                                                </tr>
                                            </tbody>
                                            <tfoot className={`border-t ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/5'}`}>
                                                <tr>
                                                    <td colSpan={2} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>TOPLAM TUTAR</td>
                                                    <td className={`px-5 py-3 text-[16px] font-bold text-right ${textMain}`}>
                                                        ₺ {(serviceHistoryDetails as any)[selectedService.id].parts.reduce((acc: number, curr: any) => acc + (curr.price * curr.qty), 0) + (serviceHistoryDetails as any)[selectedService.id].laborPrice}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    ) : (
                                        <div className={`p-8 text-center text-[13px] font-medium ${textMuted}`}>Bu servis kaydı için detaylı döküm henüz oluşturulmadı.</div>
                                    )}
                                </div>
                            </div>

                            {/* Notifications / Actions */}
                            <div className="flex flex-col gap-5 pt-2">
                                {(serviceHistoryDetails as any)[selectedService.id] && (
                                    <div className={`p-4 rounded-[16px] border flex items-center gap-4 ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${isLight ? 'bg-white text-amber-500 shadow-sm' : 'bg-amber-500/20 text-amber-400'}`}>
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div>
                                            <div className={`text-[11px] font-semibold uppercase tracking-wide ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>Gelecek Bakım Önerisi</div>
                                            <div className={`text-[14px] font-bold ${isLight ? 'text-slate-900' : 'text-amber-100'}`}>{(serviceHistoryDetails as any)[selectedService.id].nextMaintenance}</div>
                                        </div>
                                    </div>
                                )}

                                <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button className={`h-[40px] px-5 rounded-[12px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all border ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#0f172a] border-white/10 text-slate-300 hover:bg-white/5'}`}>
                                            <Printer size={16} />
                                            <span>Yazdır</span>
                                        </button>
                                        <button 
                                             onClick={() => router.push(`/service/${selectedService.id}`)}
                                             className={`h-[40px] px-5 rounded-[12px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all border ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#0f172a] border-white/10 text-slate-300 hover:bg-white/5'}`}>
                                            Detay Sayfası
                                        </button>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {selectedService.status === 'Beklemede' && (
                                            <button 
                                                onClick={() => handleStartService(selectedService.id)}
                                                disabled={isUpdating}
                                                className={`flex-1 sm:flex-none h-[40px] px-6 rounded-[12px] text-[13px] font-black uppercase tracking-widest shadow-sm transition-all ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                            >
                                                {isUpdating ? '...' : 'İşlemi Başlat'}
                                            </button>
                                        )}
                                        {selectedService.status === 'İşlemde' && (
                                            <button 
                                                onClick={() => handleCompleteService(selectedService.id)}
                                                disabled={isUpdating}
                                                className={`flex-1 sm:flex-none h-[40px] px-6 rounded-[12px] text-[13px] font-black uppercase tracking-widest shadow-sm transition-all ${isLight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                                            >
                                                {isUpdating ? '...' : 'İşlemi Bitir'}
                                            </button>
                                        )}
                                        <button onClick={() => setSelectedService(null)} className={`flex-1 sm:flex-none h-[40px] px-5 rounded-[12px] text-[13px] font-semibold transition-all ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}>Kapat</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KanbanCard({ job, isLight, textMain, textMuted, cardBg, router, onStart, isActive, isDone }: any) {
    const textBlue = isLight ? 'text-blue-600' : 'text-blue-400';
    
    return (
        <div className={`p-5 rounded-[24px] border shadow-sm space-y-4 group transition-all hover:shadow-xl hover:border-blue-500/50 ${cardBg} ${isActive ? (isLight ? 'border-blue-100 bg-blue-50/10' : 'border-blue-500/20 bg-blue-500/5') : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className={`text-[14px] font-black tracking-tight ${textMain}`}>{job.vehicleBrand || 'Marka Belirtilmemiş'}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${textBlue} mt-0.5`}>SRV-{job.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest border uppercase ${isDone ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    {job.plate || 'PLAKASIZ'}
                </div>
            </div>
            
            <div className="flex items-center gap-3 py-1">
                <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-black ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white'}`}>
                    {(job.technician?.name || 'P').split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex flex-col">
                    <span className={`text-[12px] font-bold ${textMain}`}>{job.technician?.name || 'Atanmadı'}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${textMuted}`}>Sorumlu Personel</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{isActive ? 'İşlemler' : isDone ? 'Tamamlanma' : 'Geliş'}</span>
                    <span className={`text-[11px] font-black ${textMain}`}>{isActive ? (job.items?.length || 0) + ' Kalem' : new Date(job.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex gap-2">
                    {onStart && (
                        <button onClick={onStart} className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-110 active:scale-95 transition-all">
                            <Wrench size={14} />
                        </button>
                    )}
                    <button onClick={() => router.push(`/service/${job.id}`)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
