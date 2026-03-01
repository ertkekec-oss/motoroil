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
    }, [hasFeature, currentUser, router]);

    const isSystemAdmin = currentUser?.role === 'Admin';

    const [activeServiceTab, setActiveServiceTab] = useState<'jobs' | 'calendar'>('jobs');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [activeJobs, setActiveJobs] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            if (data.success) {
                setActiveJobs(data.services || []);
            }
        } catch (error) { console.error("Service fetch error", error); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchServices();
        setAppointments([]);
        const intv = setInterval(fetchServices, 45000);
        return () => clearInterval(intv);
    }, []);

    const filteredJobs = !hasPermission('branch_isolation') || isSystemAdmin
        ? activeJobs
        : activeJobs.filter((j: any) => j.branch === currentUser?.branch);

    const filteredAppointments = !hasPermission('branch_isolation') || isSystemAdmin
        ? appointments
        : appointments.filter((a: any) => a.branch === currentUser?.branch);

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
    const pageBg = isLight ? 'min-h-screen bg-[#fafafa]' : 'min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]';

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
                            <h1 className={`text-[28px] font-bold tracking-tight ${textMain}`}>Servis Masası</h1>
                            <p className={`text-[13px] font-medium leading-none mt-1 ${textMuted}`}>Atölye Durumu ve Randevu Planlama</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-[999px] border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                            <span className={`text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>Atölye Doluluk</span>
                            <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <span className="text-[12px] font-bold text-amber-500">%65</span>
                        </div>
                        <button onClick={() => router.push('/service/new')} className={`px-5 py-2.5 rounded-[12px] text-[13px] font-semibold flex items-center gap-2 transition-all shadow-sm ${isLight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                            <span>Yeni Servis Kaydı</span>
                        </button>
                    </div>
                </header>

                {/* --- KPI CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {[
                        { label: 'Açık İş Emri', value: filteredJobs.length, unit: 'Araç', icon: <FileText size={18} />, color: isLight ? 'text-blue-600' : 'text-blue-400' },
                        { label: 'Bugün Tamamlanan', value: activeJobs.filter(j => j.status === 'Tamamlandı').length, unit: 'Araç', icon: <CheckCircle2 size={18} />, color: isLight ? 'text-emerald-600' : 'text-emerald-400' },
                        { label: 'Bekleyen Randevu', value: appointments.length, unit: 'Randevu', icon: <Calendar size={18} />, color: isLight ? 'text-amber-500' : 'text-amber-400' },
                        { label: 'Ortalama Teslimat', value: '3.2', unit: 'Saat', icon: <Clock size={18} />, color: isLight ? 'text-slate-600' : 'text-slate-300' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-5 rounded-[18px] border shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all hover:border-blue-500/30 ${cardBg}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    {stat.icon}
                                    <span className="text-[11px] font-semibold uppercase tracking-wide">{stat.label}</span>
                                </div>
                                {stat.value > 0 && <span className={`w-2 h-2 rounded-full ${stat.color === (isLight ? 'text-emerald-600' : 'text-emerald-400') ? 'bg-emerald-500' : 'bg-blue-500'}`} />}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-[32px] font-bold leading-none tracking-tight ${textMain}`}>{stat.value}</span>
                                <span className={`text-[13px] font-medium ${textMuted}`}>{stat.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- TABS / SEGMENTED CONTROL --- */}
                <div className={`inline-flex p-1 rounded-[999px] border shadow-sm ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                    <button
                        onClick={() => setActiveServiceTab('jobs')}
                        className={`px-6 py-2 rounded-[999px] text-[13px] font-semibold transition-all flex items-center gap-2 ${activeServiceTab === 'jobs' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-white shadow-sm') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}
                    >
                        <span>Atölye (Aktif İşler)</span>
                        {filteredJobs.length > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${activeServiceTab === 'jobs' ? (isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400') : (isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400')}`}>
                                {filteredJobs.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveServiceTab('calendar')}
                        className={`px-6 py-2 rounded-[999px] text-[13px] font-semibold transition-all flex items-center gap-2 ${activeServiceTab === 'calendar' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-white shadow-sm') : (isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}
                    >
                        <span>Randevu Takvimi</span>
                    </button>
                </div>

                {/* --- TABLE CONTENT --- */}
                <div className={`rounded-[20px] border shadow-sm overflow-hidden ${cardBg}`}>
                    {activeServiceTab === 'jobs' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-white/[0.02]'}`}>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>İş Kaydı</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>Araç / Plaka</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>Giriş Saati</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>Durum</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase ${textMuted}`}>Teknisyen</th>
                                        <th className={`h-[40px] px-6 text-[11px] font-medium tracking-wide uppercase text-right ${textMuted}`}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                                    {filteredJobs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className={`w-12 h-12 flex items-center justify-center rounded-full ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'}`}>
                                                        <Wrench size={24} />
                                                    </div>
                                                    <div className={`text-[14px] font-medium ${textMuted}`}>Atölyede aktif iş bulunmuyor.</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginate(filteredJobs).map((job) => (
                                            <tr key={job.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[14px] font-semibold ${textMain}`}>#{job.id.slice(-6).toUpperCase()}</span>
                                                        <span className={`text-[11px] font-medium tracking-wide uppercase mt-0.5 ${textMuted}`}>Servis Kaydı</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[14px] font-medium ${textMain}`}>{job.vehicle || (job.vehicleBrand ? `${job.vehicleBrand} ${job.vehicleSerial || ''}` : 'Belirtilmemiş')}</span>
                                                        <div className="mt-1">
                                                            <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold tracking-wider font-mono border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                                                {job.plate || 'PLAKASIZ'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[13px] font-medium ${textMuted}`}>{job.entry || new Date(job.createdAt).toLocaleDateString('tr-TR')}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-[999px] text-[11px] font-semibold uppercase tracking-wide border ${job.status === 'İşlemde' ? (isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20') :
                                                        job.status === 'Tamamlandı' ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') :
                                                            (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700')
                                                        }`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'}`}>
                                                            {(job.technician || 'Personel').split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <span className={`text-[13px] font-medium ${textMain}`}>{job.technician || 'Atanmadı'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedService(job)}
                                                        className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-all shadow-sm border ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#0f172a] border-white/10 text-slate-300 hover:bg-white/5'}`}
                                                    >
                                                        Detay
                                                    </button>
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
                                            <tr key={app.id} className={`transition-colors flex-col ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[14px] font-semibold ${textMain}`}>{app.time}</span>
                                                        <span className={`text-[12px] font-medium mt-0.5 ${textMuted}`}>{app.date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[14px] font-medium ${textMain}`}>{app.customer}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[13px] font-medium ${textMain}`}>{app.vehicle}</span>
                                                        <span className={`text-[11px] font-mono tracking-wider mt-0.5 ${textMuted}`}>{app.plate}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-[6px] text-[11px] font-medium border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>{app.type}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className={`h-[32px] px-3 rounded-[8px] text-[12px] font-medium transition-all ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                                                            Hizmete Al
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
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/40' : 'bg-slate-900/60'}`}>
                    <div className={`w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[24px] border shadow-2xl relative flex flex-col ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                        {/* Modal Header */}
                        <div className={`p-6 flex justify-between items-start sticky top-0 z-10 border-b backdrop-blur-md ${isLight ? 'bg-white/95 border-slate-200' : 'bg-[#0f172a]/95 border-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shadow-sm border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className={`text-[20px] font-bold tracking-tight ${textMain}`}>Servis Kaydı Detayı</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[13px] font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>#{selectedService.id.slice(-6).toUpperCase()}</span>
                                        <div className={`w-1 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`}></div>
                                        <span className={`text-[12px] font-medium ${textMuted}`}>{selectedService.entry} Giriş Yapıldı</span>
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
                                    <div className={`text-[16px] font-bold ${textMain} mb-1`}>{selectedService.vehicle}</div>
                                    <div className={`text-[13px] font-medium ${isLight ? 'text-blue-600' : 'text-blue-400'} mb-3`}>Plaka: {selectedService.plate}</div>
                                    <div className={`flex items-center gap-2 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                        <div className={`p-1.5 rounded-md ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
                                            <MapPin size={12} />
                                        </div>
                                        <span className={`text-[13px] font-medium ${textMain}`}>{selectedService.customer}</span>
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
                                            <span className={`text-[13px] font-semibold ${textMain}`}>{selectedService.technician || 'Atanmadı'}</span>
                                        </div>
                                        <div className={`flex items-center justify-between pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                            <span className={`text-[13px] font-medium ${textMuted}`}>Durum</span>
                                            <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wider ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {selectedService.status}
                                            </span>
                                        </div>
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
                                    <button className={`w-full sm:w-auto h-[40px] px-5 rounded-[12px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all border ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#0f172a] border-white/10 text-slate-300 hover:bg-white/5'}`}>
                                        <Printer size={16} />
                                        <span>Servis Formu Yazdır</span>
                                    </button>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => setSelectedService(null)} className={`flex-1 sm:flex-none h-[40px] px-5 rounded-[12px] text-[13px] font-semibold transition-all ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}>Vazgeç</button>
                                        <button className={`flex-1 sm:flex-none h-[40px] px-6 rounded-[12px] text-[13px] font-semibold flex items-center justify-center transition-all shadow-sm ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>Kaydı Güncelle</button>
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
