"use client";

import { useState, useEffect } from 'react';
import { Calendar, MessageSquare, Briefcase, FileText, CheckCircle2, UserCircle, Flag, XCircle } from 'lucide-react';
import {
    IconActivity,
    IconTrendingUp,
    IconClock,
    IconCheck,
    IconAlert,
    IconZap,
    IconShield,
    IconRefresh,
    IconTrash
} from '@/components/icons/PremiumIcons';
import { useApp } from '@/contexts/AppContext';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import {
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseInput,
    EnterpriseTextarea,
    EnterpriseSelect,
    EnterpriseButton
} from '@/components/ui/enterprise';

// --- UI COMPONENTS ---
const ProgressBar = ({ label, value, max, color = "#3b82f6" }: any) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span style={{ color }}>%{percentage.toFixed(0)}</span>
            </div>
            <div className={`h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden`}>
                <div
                    className={`h-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%`, background: color }}
                />
            </div>
        </div>
    );
};

// --- SUB-PAGES ---

const DashboardView = ({
    handleQrCheckin,
    handleGpsCheckin,
    isScannerOpen,
    setIsScannerOpen,
    onQrScan,
    pdksStatus,
    handleCheckout,
    targets = [],
    statsData,
    user
}: any) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#3b82f6">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Performans Skoru</h4>
                        <IconActivity className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsData?.leaderboard?.scoreValue || '0.0'}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 w-fit px-2 py-1 rounded">
                        Global Sıra: #{statsData?.leaderboard?.rankGlobal || ' -'}
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#8b5cf6">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hedef Gerçekleşme</h4>
                        <IconTrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsData?.stats?.achievement || '%0'}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-2">Bu ayki hedefler (Matris)</p>
                </EnterpriseCard>

                <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#f59e0b">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Kazanılan Prim</h4>
                        <IconClock className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsData?.stats?.bonus || '₺0'}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-2">Dönem biriken tutar</p>
                </EnterpriseCard>

                <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#10b981">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Aylık Ziyaretler</h4>
                        <IconZap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {targets?.filter((t: any) => t.type === 'VISIT').reduce((acc: number, t: any) => acc + t.currentValue, 0) || 0} <span className="text-lg text-slate-400 font-bold">Adet</span>
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-2">Saha ziyaretleri toplamı</p>
                </EnterpriseCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Targets & Performance */}
                <div className="lg:col-span-2">
                    <EnterpriseCard className="h-full">
                        <EnterpriseSectionHeader title="Hedefler & Performans" icon="📈" />
                        <div className="p-6 space-y-8">
                            {(!targets || targets.length === 0) && (!statsData?.assignments || statsData?.assignments?.length === 0) ? (
                                <div className="text-center text-sm font-semibold text-slate-400 py-6 border border-dashed border-slate-300 dark:border-slate-700/50 rounded-lg">
                                    Size atanmış aktif bir personel hedefi bulunmamaktadır.
                                </div>
                            ) : (
                                <>
                                    {targets?.map((t: any) => (
                                        <ProgressBar 
                                            key={t.id} 
                                            label={t.type === 'TURNOVER' ? `💰 Ciro Hedefi (₺${Number(t.targetValue).toLocaleString()})` : `📍 Ziyaret Hedefi (${t.targetValue} Adet)`} 
                                            value={t.currentValue} 
                                            max={t.targetValue} 
                                            color={t.type === 'TURNOVER' ? "#3b82f6" : "#10b981"} 
                                        />
                                    ))}
                                    {statsData?.assignments?.map((ass: any) => (
                                        <ProgressBar 
                                            key={ass.id} 
                                            label={`🎯 Matrix Şirket Hedefi (${ass.period?.name})`} 
                                            value={ass.performances?.[0]?.actual || 0} 
                                            max={ass.target} 
                                            color="#8b5cf6" 
                                        />
                                    ))}
                                </>
                            )}
                            
                            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="text-lg">📋</span> Aktif Görevler
                                </h4>
                                <div className="text-center text-sm font-semibold text-slate-400 py-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                                    Bekleyen görev bulunmamaktadır. Lütfen "Görevlerim" sekmesini kontrol edin.
                                </div>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Shift & Calendar */}
                <div>
                    <EnterpriseCard className="h-full">
                        <EnterpriseSectionHeader title="Vardiya & Çalışma" icon="⏰" />
                        <div className="p-6 space-y-6">
                            <div className="p-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-center">
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Şu Anki Vardiya</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{pdksStatus?.staff?.shiftTemplate || 'Belirsiz'}</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Haftalık Akış</h4>
                                <div className="text-center text-sm font-semibold text-slate-400 py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                                    Vardiya planı tanımlanmamış.
                                </div>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>
            </div>

            {/* Payroll Summary & PDKS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Son Bordro Özetleri" icon="🛡️" />
                    <div className="p-6">
                        <div className="py-12 text-sm font-semibold text-slate-400 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                            Geçmiş bordro kaydı bulunamadı.
                        </div>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="PDKS İşlemleri" icon="⚡" />
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {!pdksStatus?.isWorking ? (
                                <>
                                    <button
                                        onClick={handleQrCheckin}
                                        className="flex flex-col items-center gap-3 p-6 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                            <span className="text-2xl">📱</span>
                                        </div>
                                        <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-center">Ofis Girişi (QR)</span>
                                    </button>

                                    <button
                                        onClick={handleGpsCheckin}
                                        className="flex flex-col items-center gap-3 p-6 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                            <span className="text-2xl">📍</span>
                                        </div>
                                        <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-center">Saha Girişi (GPS)</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleCheckout}
                                    className="col-span-2 flex flex-col items-center gap-3 p-6 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-xl transition-all group"
                                >
                                    <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                                        <span className="text-2xl">🏁</span>
                                    </div>
                                    <span className="text-[12px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest text-center">MESAİYİ BİTİR (ÇIKIŞ YAP)</span>
                                </button>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Cihaz Durumu</h4>
                                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">GÜVENLİ & EŞLEŞMİŞ</p>
                                </div>
                            </div>
                            <button className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg">Senkronize Et</button>
                        </div>

                        <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest opacity-80">
                            🔒 Loglar uçtan uca şifreli olarak saklanır.
                        </p>
                    </div>
                </EnterpriseCard>

                <BarcodeScanner
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScan={onQrScan}
                />
            </div>
        </div>
    );
};

const LeaveRequestView = ({ user }: any) => {
    const [type, setType] = useState('Yıllık İzin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [leaves, setLeaves] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaves = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/staff/leaves?staffId=${user?.id}`);
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchLeaves();
    }, [user?.id]);

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            toast.error("Lütfen tarihleri eksiksiz doldurun.");
            return;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            toast.error("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
            return;
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const _days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/staff/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: user.id,
                    type,
                    startDate,
                    endDate,
                    days: _days,
                    reason
                })
            });

            if (res.ok) {
                toast.success("İzin talebi gönderildi.");
                setStartDate('');
                setEndDate('');
                setReason('');
                setType('Yıllık İzin');
                fetchLeaves();
            } else {
                toast.error("İzin talebi gönderilemedi.");
            }
        } catch (error) {
            toast.error("İşlem başarısız oldu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-1">
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="Yeni Talep Oluştur" icon="📝" />
                    <div className="p-6 space-y-5">
                        <EnterpriseSelect 
                            label="İzin Türü" 
                            value={type} 
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="Yıllık İzin">Yıllık Ücretli İzin</option>
                            <option value="Mazeret İzni">Mazeret İzni</option>
                            <option value="Sağlık İzni">Hastalık / Sağlık Raporu</option>
                            <option value="Ücretsiz İzin">Ücretsiz İzin</option>
                        </EnterpriseSelect>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <EnterpriseInput 
                                label="Başlangıç Tarihi" 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <EnterpriseInput 
                                label="Bitiş Tarihi" 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        
                        <EnterpriseTextarea 
                            label="Not / Açıklama" 
                            placeholder="İzin nedeninizi kısaca belirtin..." 
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        
                        <EnterpriseButton 
                            variant="primary" 
                            className="w-full mt-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "GÖNDERİLİYOR..." : "TALEBİ GÖNDER"}
                        </EnterpriseButton>
                    </div>
                </EnterpriseCard>
            </div>

            <div className="lg:col-span-2">
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="Geçmiş Taleplerim" icon="🕒" />
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-4 py-3">Tür</th>
                                        <th className="px-4 py-3">Tarih Aralığı</th>
                                        <th className="px-4 py-3">Durum</th>
                                        <th className="px-4 py-3">Onaylayan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
                                                Yükleniyor...
                                            </td>
                                        </tr>
                                    ) : leaves.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-sm font-semibold text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                                                Geçmiş izin talebi kaydı bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.map((leave, i) => (
                                            <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    {leave.type}
                                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{leave.days} Gün</div>
                                                </td>
                                                <td className="px-4 py-3 text-[12px] font-medium text-slate-500">
                                                    {new Date(leave.startDate).toLocaleDateString('tr-TR')} - {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${
                                                        leave.status === 'Onaylandı' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                        leave.status === 'Reddedildi' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                                        'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                    }`}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[12px] font-medium text-slate-500">
                                                    {leave.approvedBy || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
};


const MyTasksView = ({ user }: any) => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Filters & Pagination
    const [filterStatus, setFilterStatus] = useState('Devam Edenler'); // 'Tümü', 'Devam Edenler', 'Tamamlandı'
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 10;

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/staff/tasks?staffId=${user?.id}`);
            if (res.ok) setTasks(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchTasks();
    }, [user?.id]);

    const handleSendFeedback = async (statusOverride?: string) => {
        if (!selectedTask) return;
        setIsUpdating(true);
        try {
            if (feedback.trim()) {
                await fetch(`/api/staff/tasks/${selectedTask.id}/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: feedback, isFromStaff: true })
                });
            }
            if (statusOverride) {
                await fetch(`/api/staff/tasks/${selectedTask.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: statusOverride })
                });
            }
            toast.success("Bilgiler iletildi!");
            setFeedback('');
            fetchTasks();
            setSelectedTask(null);
        } catch(e) {
            toast.error("İşlem başarısız.");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (filterStatus === 'Tümü') return true;
        if (filterStatus === 'Tamamlandı') return t.status === 'Tamamlandı';
        // 'Devam Edenler' means any task that is NOT Tamamlandı or İptal
        return t.status !== 'Tamamlandı' && t.status !== 'İptal';
    });

    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 min-h-[500px]">
            <div className="lg:col-span-1">
                <EnterpriseCard className="h-full flex flex-col">
                    <EnterpriseSectionHeader title="Atanan Görevlerim" icon="📋" />
                    
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-lg">
                            {['Devam Edenler', 'Tamamlandı', 'Tümü'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => { setFilterStatus(status); setCurrentPage(1); setSelectedTask(null); }}
                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${filterStatus === status ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loading ? (
                            <p className="text-center text-sm font-semibold text-slate-400 p-8">Yükleniyor...</p>
                        ) : paginatedTasks.length === 0 ? (
                            <p className="text-center text-sm font-semibold text-slate-400 p-8">Bu filtreye uygun görev yok.</p>
                        ) : (
                            paginatedTasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTask?.id === task.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 shadow-sm' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-400'}`}
                                >
                                    <h4 className="text-[14px] font-black text-slate-900 dark:text-white mb-2 line-clamp-1">{task.title}</h4>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span className={
                                            task.status === 'Tamamlandı' ? 'text-emerald-600' :
                                            task.status === 'İptal' ? 'text-slate-500' : 'text-amber-500'
                                        }>{task.status}</span>
                                        <span className="flex items-center gap-1"><Flag className="w-3 h-3"/> {task.priority}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-3 py-1.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-50"
                            >GERİ</button>
                            <span>Sayfa {currentPage} / {totalPages}</span>
                            <button 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-3 py-1.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-50"
                            >İLERİ</button>
                        </div>
                    )}
                </EnterpriseCard>
            </div>

            <div className="lg:col-span-2">
                <EnterpriseCard className="h-full flex flex-col overflow-hidden">
                    <EnterpriseSectionHeader title="Görev Detayı & İşlemler" icon="⚡" />
                    {!selectedTask ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-50">
                            <Briefcase className="w-16 h-16 text-slate-400 mb-4" />
                            <p className="font-bold text-slate-500 uppercase tracking-widest text-[13px]">Detayları görmek için listeden görev seçin.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                                <h2 className="text-[18px] font-black text-slate-900 dark:text-white mb-2">{selectedTask.title}</h2>
                                {selectedTask.dueDate && (
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 w-max rounded-lg border border-rose-200 dark:border-rose-500/20">
                                        <Calendar className="w-4 h-4"/> Son Teslim: {new Date(selectedTask.dueDate).toLocaleDateString('tr-TR')}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {selectedTask.description && (
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Yönetici Notu & Açıklama</h4>
                                        <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedTask.description}</p>
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Bildirim Geçmişi</h4>
                                    {selectedTask.feedbacks?.length === 0 ? (
                                        <p className="text-[11px] font-medium text-slate-400 italic">Henüz yorum yok.</p>
                                    ) : (
                                        selectedTask.feedbacks?.map((fb: any) => (
                                            <div key={fb.id} className={`p-4 rounded-xl max-w-[85%] ${fb.isFromStaff ? 'bg-amber-50 dark:bg-amber-500/10 ml-auto border border-amber-200 dark:border-amber-500/20 text-right' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'}`}>
                                                <div className={`flex justify-between items-center mb-2 ${fb.isFromStaff && 'flex-row-reverse'}`}>
                                                    <span className="text-[12px] font-black text-slate-900 dark:text-white opacity-80">{fb.isFromStaff ? user?.name : 'Yönetim / İK'}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(fb.createdAt).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month:'2-digit' })}</span>
                                                </div>
                                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{fb.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                                {selectedTask.status === 'Tamamlandı' ? (
                                    <div className="bg-emerald-50 text-emerald-600 font-bold text-[12px] p-4 text-center rounded-lg border border-emerald-200 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-5 h-5"/> BU GÖREV TAMAMLANDI.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <textarea
                                            className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-[13px] font-medium outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-all resize-none shadow-inner text-slate-900 dark:text-white"
                                            placeholder="Görev hakkında durum bildirimi veya not yazın..."
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleSendFeedback()}
                                                disabled={isUpdating || !feedback.trim()}
                                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                            >
                                                Sadece Yorum Gönder
                                            </button>
                                            <button 
                                                onClick={() => handleSendFeedback('Tamamlandı')}
                                                disabled={isUpdating}
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4"/> TAMAMLADIM (KAPAT)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </EnterpriseCard>
            </div>
        </div>
    );
};


const ProfileSettingsView = ({ user }: any) => {
    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <EnterpriseCard>
                <EnterpriseSectionHeader title="Profil & Güvenlik Ayarları" icon="⚙️" />
                <div className="p-8">
                    <div className="flex items-center gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white relative group shadow-lg">
                            {user?.name?.[0]?.toUpperCase() || 'P'}
                            <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-all flex items-center justify-center text-[10px] font-bold tracking-widest uppercase">Değiştir</button>
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{user?.name}</h4>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-widest rounded-md">
                                {user?.role || 'Personel'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <EnterpriseInput label="Tam Ad Soyad" defaultValue={user?.name} />
                        <EnterpriseInput label="E-Posta Adresi" type="email" defaultValue={user?.email} />
                        <EnterpriseInput label="Telefon Numarası" type="tel" placeholder="+90 5xx xxx xx xx" />
                        <EnterpriseInput label="Adres" />
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h4 className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <span>🔒</span> Güvenlik Ayarları
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EnterpriseInput label="Yeni Şifre" type="password" />
                            <EnterpriseInput label="Şifre Tekrar" type="password" />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end gap-3">
                        <EnterpriseButton variant="secondary" className="px-8">İPTAL</EnterpriseButton>
                        <EnterpriseButton variant="primary" className="px-10">KAYDET VE GÜNCELLE</EnterpriseButton>
                    </div>
                </div>
            </EnterpriseCard>
        </div>
    );
};

// --- MAIN PAGE ---

export default function PersonelPanel() {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'leave' | 'profile'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const [pdksStatus, setPdksStatus] = useState<any>(null);
    const [scanMode, setScanMode] = useState<'IN' | 'OUT'>('IN');
    const [targets, setTargets] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any>(null);

    const fetchPerformanceData = async () => {
        try {
            const [hrRes, targetsRes] = await Promise.all([
                fetch('/api/hr/performance/dashboard').then(r => r.json()),
                fetch('/api/staff/targets?mine=true').then(r => r.json())
            ]);
            if (hrRes.success) setStatsData(hrRes.data);
            if (Array.isArray(targetsRes)) setTargets(targetsRes);
        } catch (e) {
            console.error("Perf verisi alınamadı", e);
        }
    };

    const fetchPdksStatus = async () => {
        try {
            const res = await fetch("/api/staff/me/pdks-status");
            const data = await res.json();
            if (data.success) {
                setPdksStatus(data);
            }
        } catch (e) {
            console.error("pdks status failed", e);
        }
    };

    // PDKS Fonksiyonları
    const getFingerprint = () => {
        return btoa(navigator.userAgent + screen.width + screen.height).slice(0, 32);
    };

    const handleQrCheckin = () => {
        setIsScannerOpen(true);
    };

    const onQrScan = async (token: string) => {
        toast.loading("Konum ve cihaz doğrulanıyor...", { id: "pdks" });
        try {
            const res = await fetch(scanMode === 'IN' ? "/api/v1/pdks/check-in" : "/api/v1/pdks/check-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "OFFICE_QR",
                    qrToken: token,
                    deviceFp: getFingerprint(),
                    clientTime: new Date().toISOString(),
                    offlineId: uuidv4()
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(scanMode === 'IN' ? "Mesai Başlatıldı!" : "Çıkış Yapıldı!", { id: "pdks" });
                if (data.status === "PENDING") toast.warning("Risk uyarısı: Yönetici onayı bekleniyor.");
                setIsScannerOpen(false);
                fetchPdksStatus();
            } else {
                toast.error(data.error || "İşlem başarısız", { id: "pdks" });
            }
        } catch (err) {
            toast.error("Bağlantı hatası", { id: "pdks" });
        }
    };

    const handleGpsCheckin = () => {
        if (!navigator.geolocation) {
            return toast.error("Tarayıcınız konum bilgisini desteklemiyor.");
        }

        toast.loading("Konum alınıyor...", { id: "gps" });

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch("/api/v1/pdks/check-in", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mode: "FIELD_GPS",
                        deviceFp: getFingerprint(),
                        clientTime: new Date().toISOString(),
                        location: {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            acc: pos.coords.accuracy
                        },
                        offlineId: uuidv4()
                    })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success("Saha Girişi Yapıldı!", { id: "gps" });
                    fetchPdksStatus();
                } else {
                    toast.error(data.error || "Giriş başarısız", { id: "gps" });
                }
            } catch (err) {
                toast.error("Bağlantı hatası", { id: "gps" });
            }
        }, (err) => {
            toast.error("Konum izni reddedildi veya alınamadı.", { id: "gps" });
        }, { enableHighAccuracy: true });
    };

    const handleCheckout = () => {
        // Active session how did it check in? GPS or QR? We don't necessarily know exactly which is easier,
        // let's do a prompt to let them select or just simply do GPS checkout if they clicked this directly.
        // Or open QR scanner in OUT mode
        showCheckoutOptions();
    };

    const showCheckoutOptions = () => {
        toast((t) => (
            <div>
                <p className="font-semibold text-slate-900 mb-3">Çıkış yöntemini seçin:</p>
                <div className="flex gap-2">
                    <button onClick={() => { toast.dismiss(t.id); setScanMode('OUT'); setIsScannerOpen(true); }} className="px-3 py-1.5 bg-indigo-500 text-white rounded font-medium text-xs">Ofis Çıkışı (QR)</button>
                    <button onClick={() => { toast.dismiss(t.id); exactGpsCheckout(); }} className="px-3 py-1.5 bg-emerald-500 text-white rounded font-medium text-xs">Saha Çıkışı (GPS)</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const exactGpsCheckout = () => {
        if (!navigator.geolocation) return toast.error("Tarayıcınız desteklemiyor.");
        toast.loading("Konum alınıyor...", { id: "gps_out" });
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch("/api/v1/pdks/check-out", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mode: "FIELD_GPS",
                        deviceFp: getFingerprint(),
                        clientTime: new Date().toISOString(),
                        location: { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy },
                        offlineId: uuidv4()
                    })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success("Çıkış Yapıldı!", { id: "gps_out" });
                    fetchPdksStatus();
                } else toast.error(data.error || "Başarısız", { id: "gps_out" });
            } catch (err) { toast.error("Bağlantı hatası", { id: "gps_out" }); }
        }, () => toast.error("Konum izni alınamadı", { id: "gps_out" }), { enableHighAccuracy: true });
    };

    useEffect(() => {
        fetchPdksStatus();
        fetchPerformanceData();
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-pulse text-indigo-400/50">
            <div className="h-20 bg-slate-100 dark:bg-slate-800/30 rounded-2xl w-full" />
            <div className="grid grid-cols-4 gap-6">
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
            </div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800/30 rounded-2xl w-full" />
        </div>
    );

    return (
        <div style={{ background: 'var(--bg-main)' }} className="min-h-screen text-slate-900 dark:text-white transition-colors duration-300">
            {/* EXECUTIVE HEADER STRIP */}
            <div style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)' }} className="px-8 py-6 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="text-3xl">👨‍💼</span> PERSONEL OPERASYON PANELİ
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-emerald-500">🟢</span> Merhaba, {currentUser?.name || 'Kullanıcı'} • Bugün Çok Verimlisin!
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end px-5 border-r border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mesai Durumu</span>
                            {pdksStatus?.isWorking ? (
                                <span className="text-xs font-black text-emerald-500 mt-0.5 flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-default">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    AKTİF ÇALIŞIYOR
                                </span>
                            ) : (
                                <span className="text-xs font-black text-slate-400 mt-0.5 flex items-center gap-1.5 cursor-default">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    MESAİDE DEĞİL
                                </span>
                            )}
                        </div>
                        <button onClick={fetchPdksStatus} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Verileri Yenile">
                            <IconRefresh className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-8 space-y-8 animate-in fade-in duration-700 pb-24">
                {/* Navigation Tabs (Grouped Navigation Style) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/30 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`${activeTab === 'dashboard'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2`}
                                >
                                    <IconActivity className="w-4 h-4" /> Genel Durum
                                </button>
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={`${activeTab === 'tasks'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2`}
                                >
                                    <Briefcase className="w-4 h-4" /> Görevlerim
                                </button>

                                <button
                                    onClick={() => setActiveTab('leave')}
                                    className={`${activeTab === 'leave'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2`}
                                >
                                    <IconClock className="w-4 h-4" /> İzin Taleplerim
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`${activeTab === 'profile'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2`}
                                >
                                    <IconShield className="w-4 h-4" /> Profil & Hesap
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Rendering */}
                {activeTab === 'dashboard' && (
                    <DashboardView
                        handleQrCheckin={handleQrCheckin}
                        handleGpsCheckin={handleGpsCheckin}
                        isScannerOpen={isScannerOpen}
                        setIsScannerOpen={setIsScannerOpen}
                        onQrScan={onQrScan}
                     targets={targets} statsData={statsData} user={currentUser} />
                )}
                {activeTab === 'tasks' && <MyTasksView user={currentUser} />}
                {activeTab === 'leave' && <LeaveRequestView user={currentUser} />}
                {activeTab === 'profile' && <ProfileSettingsView user={currentUser} />}

            </div>

            {/* Branding Footer */}
            <div style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)' }} className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center">
                <div className="max-w-[1600px] mx-auto w-full flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>© 2026 PERIODYA OS • İNSAN KAYNAKLARI MODÜLÜ</span>
                    <span className="text-blue-500 font-black">🔒 Verileriniz Uçtan Uca Şifrelenmiştir</span>
                </div>
            </div>
        </div>
    );
}
