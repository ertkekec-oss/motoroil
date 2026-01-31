"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Pagination from '@/components/Pagination';

export default function ServiceDashboard() {
    const { user: currentUser, hasPermission } = useAuth(); // AuthContext provides user and hasPermission
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

    // fetchAppointments eklendi (veya statik veri)
    useEffect(() => {
        fetchServices();
        // Şimdilik boş dizi verelim ki çökmesin
        setAppointments([]);
        const intv = setInterval(fetchServices, 45000); // Keep the interval for fetchServices
        return () => clearInterval(intv);
    }, []);

    const handleDeleteService = async (id: string) => {
        // Modal context'i kullanılmıyor, şimdilik console log verelim veya context ekleyelim
        console.log("Delete service", id);
    };

    // Filtreleme mantığı düzeltildi
    const filteredJobs = !hasPermission('branch_isolation') || isSystemAdmin
        ? activeJobs
        : activeJobs.filter((j: any) => j.branch === currentUser?.branch);

    const filteredAppointments = !hasPermission('branch_isolation') || isSystemAdmin
        ? appointments
        : appointments.filter((a: any) => a.branch === currentUser?.branch);

    // PAGINATION LOGIC
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

    return (
        <div className="container p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shadow-inner border border-primary/20">🛠️</div>
                        <h1 className="text-4xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                            Servis Masası
                        </h1>
                    </div>
                    <p className="text-white/40 font-medium ml-15">Atölye Durumu ve Randevu Planlama</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="px-4 py-2 flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Atölye Doluluk</span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: '65%' }}></div>
                            </div>
                            <span className="text-sm font-black text-warning">%65</span>
                        </div>
                    </div>
                    <a href="/service/new" className="group relative px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <span className="text-xl leading-none font-light">+</span>
                        <span>Yeni Servis Kaydı</span>
                        <div className="absolute inset-x-0 bottom-0 h-px bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></div>
                    </a>
                </div>
            </header>

            {/* --- STATS SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Açık İş Emri', value: filteredJobs.length, unit: 'Araç', icon: '📝', color: 'text-primary' },
                    { label: 'Bugün Tamamlanan', value: activeJobs.filter(j => j.status === 'Tamamlandı').length, unit: 'Araç', icon: '✅', color: 'text-success' },
                    { label: 'Bekleyen Randevu', value: appointments.length, unit: 'Randevu', icon: '📅', color: 'text-secondary' },
                    { label: 'Ortalama Teslimat', value: '3.2', unit: 'Saat', icon: '⏱️', color: 'text-white' },
                ].map((stat, i) => (
                    <div key={i} className="group p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.08]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl transform group-hover:scale-110 transition-transform">{stat.icon}</div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
                                <span className="text-xs font-bold text-white/20 uppercase tracking-wider">{stat.unit}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex flex-col gap-6">
                {/* TABS */}
                <div className="flex p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 w-fit">
                    <button
                        onClick={() => setActiveServiceTab('jobs')}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeServiceTab === 'jobs' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <span>Atölye (Aktif İşler)</span>
                        <div className={`px-2 py-0.5 rounded-md text-[10px] ${activeServiceTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
                            {filteredJobs.length}
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveServiceTab('calendar')}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeServiceTab === 'calendar' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <span>Randevu Takvimi</span>
                    </button>
                </div>

                {/* TABLE/LIST SECTION */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

                    {activeServiceTab === 'jobs' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest pl-8">İş Kaydı</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest">Araç / Plaka</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest">Giriş Saati</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest">Durum</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest">Teknisyen</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest pr-8 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredJobs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center text-white/20 font-bold italic">Atölyede aktif iş bulunmuyor.</td>
                                        </tr>
                                    ) : (
                                        paginate(filteredJobs).map((job, idx) => (
                                            <tr key={job.id} className="group hover:bg-white/[0.04] transition-colors">
                                                <td className="p-6 pl-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-white group-hover:text-primary transition-colors">{job.id}</span>
                                                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Referans İş Emri</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[15px] font-bold text-white/90">{job.vehicle}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-black text-white/60 tracking-wider font-mono">
                                                                {job.plate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="text-sm font-bold text-white/60">{job.entry}</div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex">
                                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset ${job.status === 'İşlemde' ? 'bg-primary/10 text-primary ring-primary/20 bg-primary/5' :
                                                            job.status === 'Tamamlandı' ? 'bg-success/10 text-success ring-success/20 bg-success/5' :
                                                                'bg-white/10 text-white/60 ring-white/10'
                                                            }`}>
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40 ring-1 ring-white/10">{job.technician.split(' ').map((n: string) => n[0]).join('')}</div>
                                                        <span className="text-sm font-bold text-white/70">{job.technician}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 pr-8 text-right">
                                                    <button
                                                        onClick={() => setSelectedService(job)}
                                                        className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105"
                                                    >
                                                        Detayları Gör
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <h3 className="text-lg font-black text-white/80">Gelecek Randevular</h3>
                                <button className="px-5 py-2.5 rounded-xl bg-secondary text-black font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-secondary/20">
                                    + Randevu Oluştur
                                </button>
                            </div>
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest pl-8">Zamanlama</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest">Müşteri</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest">Araç Bilgisi</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest">İşlem Türü</th>
                                        <th className="p-5 text-[11px] font-black uppercase text-white/30 tracking-widest pr-8 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center text-white/20 font-bold italic">Bugün için bekleyen randevu bulunmuyor.</td>
                                        </tr>
                                    ) : (
                                        paginate(filteredAppointments).map((app: any) => (
                                            <tr key={app.id} className="group hover:bg-white/[0.04] transition-colors">
                                                <td className="p-6 pl-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[17px] font-black text-white">{app.time}</span>
                                                        <span className="text-[11px] text-white/40 font-bold">{app.date}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="text-sm font-black text-white/80 group-hover:text-secondary transition-colors">{app.customer}</div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white/70">{app.vehicle}</span>
                                                        <span className="text-[10px] font-black text-white/30 font-mono tracking-widest">{app.plate}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-white/60">{app.type}</span>
                                                </td>
                                                <td className="p-6 pr-8 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">
                                                            Hizmete Al
                                                        </button>
                                                        <button className="px-4 py-2 rounded-xl border border-red-500/30 text-red-500/70 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest transition-all">
                                                            İptal
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>

            {/* --- SERVICE DETAIL MODAL --- */}
            {selectedService && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in">
                    <div className="bg-[#0f111e] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-white/10 shadow-[0_32px_128px_-12px_rgba(0,0,0,0.8)] relative">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex justify-between items-start sticky top-0 bg-[#0f111e] z-10 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary backdrop-blur-md flex items-center justify-center text-3xl shadow-2xl shadow-primary/40 text-white">⚙️</div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Servis Kaydı Detayı</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-primary font-black tracking-tighter text-lg">{selectedService.id}</span>
                                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                        <span className="text-white/40 text-[11px] font-black uppercase tracking-widest">{selectedService.entry} Giriş Yapıldı</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedService(null)}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-6 rounded-3xl border border-white/5">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Araç & Müşteri</label>
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <div className="font-black text-xl text-white mb-1">{selectedService.vehicle}</div>
                                            <div className="text-sm font-bold text-primary mb-3">Plaka: {selectedService.plate}</div>
                                            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                                <div className="w-6 h-6 rounded-lg bg-secondary/20 flex items-center justify-center text-[10px]">👤</div>
                                                <span className="text-sm font-bold text-white/70">{selectedService.customer}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Teknik Bilgiler</label>
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-white/40 italic">Mevcut Kilometre</span>
                                                <span className="text-lg font-black text-white">{selectedService.km.toLocaleString()} KM</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-white/40 italic">Sorumlu Teknisyen</span>
                                                <span className="text-sm font-black text-secondary">{selectedService.technician}</span>
                                            </div>
                                            <div className="pt-3 border-t border-white/5">
                                                <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase text-center">
                                                    DURUM: {selectedService.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-white/30 uppercase tracking-widest ml-1">Yapılan İşlemler & Parçalar</label>
                                <div className="bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
                                    {(serviceHistoryDetails as any)[selectedService.id] ? (
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 border-b border-white/10">
                                                <tr>
                                                    <th className="p-4 pl-6 text-[10px] font-black uppercase text-white/40">Kalem Adı</th>
                                                    <th className="p-4 text-[10px] font-black uppercase text-white/40 text-center">Miktar</th>
                                                    <th className="p-4 pr-6 text-[10px] font-black uppercase text-white/40 text-right">Tutar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {(serviceHistoryDetails as any)[selectedService.id].parts.map((p: any, i: number) => (
                                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-4 pl-6 text-sm font-bold text-white/80">{p.name}</td>
                                                        <td className="p-4 text-sm font-black text-white/60 text-center">{p.qty}</td>
                                                        <td className="p-4 pr-6 text-sm font-black text-white text-right">₺ {p.price * p.qty}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-primary/5">
                                                    <td className="p-4 pl-6 text-sm font-black text-primary">{(serviceHistoryDetails as any)[selectedService.id].labor}</td>
                                                    <td className="p-4 text-sm font-black text-primary/60 text-center">1</td>
                                                    <td className="p-4 pr-6 text-sm font-black text-primary text-right">₺ {(serviceHistoryDetails as any)[selectedService.id].laborPrice}</td>
                                                </tr>
                                            </tbody>
                                            <tfoot className="bg-white/[0.03]">
                                                <tr>
                                                    <td colSpan={2} className="p-4 pl-6 text-sm font-black text-white/40 uppercase tracking-widest">TOPLAM TUTAR</td>
                                                    <td className="p-4 pr-6 text-xl font-black text-white text-right">
                                                        ₺ {(serviceHistoryDetails as any)[selectedService.id].parts.reduce((acc: number, curr: any) => acc + (curr.price * curr.qty), 0) + (serviceHistoryDetails as any)[selectedService.id].laborPrice}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    ) : (
                                        <div className="p-10 text-center text-white/20 italic">Bu servis kaydı için detaylı döküm henüz oluşturulmadı.</div>
                                    )}
                                </div>
                            </div>

                            {/* Notes & Actions */}
                            <div className="flex flex-col gap-6">
                                {(serviceHistoryDetails as any)[selectedService.id] && (
                                    <div className="p-6 bg-warning/5 border border-warning/10 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">🔔</div>
                                        <div className="text-[10px] font-black text-warning uppercase tracking-widest mb-1">Gelecek Bakım Önerisi</div>
                                        <div className="text-xl font-black text-white tracking-tight leading-none group-hover:text-warning transition-colors">{(serviceHistoryDetails as any)[selectedService.id].nextMaintenance}</div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
                                    <button className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                        <span>🖨️</span>
                                        <span>Servis Formu Yazdır</span>
                                    </button>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button onClick={() => setSelectedService(null)} className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Vazgeç</button>
                                        <button className="flex-1 sm:flex-none px-8 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all">Kaydı Güncelle</button>
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
