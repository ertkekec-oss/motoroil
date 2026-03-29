"use client";

import { useState, useEffect, useRef } from 'react';
import { Calendar, MessageSquare, Briefcase, FileText, CheckCircle2, UserCircle, Flag, XCircle, ChevronRight, Printer, Target, TrendingUp, DollarSign, Clock, Lock, MapPin } from 'lucide-react';
import { IconActivity, IconTrendingUp, IconClock, IconCheck, IconAlert, IconZap, IconShield, IconRefresh, IconTrash } from '@/components/icons/PremiumIcons';
import { useApp } from '@/contexts/AppContext';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import {
    EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput, EnterpriseTextarea, EnterpriseSelect, EnterpriseButton
} from '@/components/ui/enterprise';

// ─── STYLES FOR PRINTING ──────────────────────────────────────────────
const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #printable-area, #printable-area * { visibility: visible; }
    #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
    .no-print { display: none !important; }
  }
`;

// ─── UI COMPONENTS ──────────────────────────────────────────────────
const ProgressBar = ({ label, value, max, color = "#3b82f6" }: any) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-text-secondary dark:text-slate-400">{label}</span>
                <span style={{ color }}>%{(percentage || 0).toFixed(0)}</span>
            </div>
            <div className="h-1.5 w-full bg-surface-secondary dark:bg-slate-800/50 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, background: color }} />
            </div>
            <div className="flex justify-end text-[10px] text-slate-400">
                {Number(value).toLocaleString()} / {Number(max).toLocaleString()}
            </div>
        </div>
    );
};

// ─── PROFILE HEADER (COMMON TOP ROW) ──────────────────────────
const ProfileHeader = ({ user, title = "ÖZET", dataCount = 0, dataLabel = "Kayıt" }: any) => {
    return (
        <div className="w-full flex justify-between items-center bg-surface dark:bg-[#0f172a] border-b border-default dark:border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-state-success-bg dark:bg-emerald-500/20 text-state-success-text dark:text-emerald-400 flex items-center justify-center text-sm font-black border border-state-success-border">
                    {user?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h3 className="text-sm font-black text-text-primary dark:text-white uppercase tracking-widest">{user?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-state-success-text"></span>
                        <p className="text-[10px] font-bold text-text-secondary tracking-widest uppercase">{user?.role || 'Personel'} — AKTİF ÇALIŞAN</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-[9px] font-bold tracking-widest text-text-muted uppercase">{title}</div>
                    <div className="text-[14px] font-mono font-black text-state-success-text dark:text-emerald-400 mt-0.5">{dataCount} <span className="text-[10px] font-bold text-text-muted uppercase">{dataLabel}</span></div>
                </div>
            </div>
        </div>
    );
};

// ─── DASHBOARD VIEW ──────────────────────────────────────────────────
const DashboardView = ({
    handleQrCheckin, handleGpsCheckin, isScannerOpen, setIsScannerOpen, onQrScan, pdksStatus, handleCheckout,
    targets = [], statsData, turnover, shifts = [], payrolls = [], tasks = [], user
}: any) => {
    const activeTasksCount = tasks.filter((t: any) => t.status !== 'Tamamlandı' && t.status !== 'İptal').length;

    // Hedefler sekmesindeki aynı dinamik hedefleri Özet tablosuna yansıtma:
    const totalTarget = targets?.reduce((sum: any, t: any) => sum + Number(t.targetValue), 0) || 0;
    const totalActual = targets?.reduce((sum: any, t: any) => sum + Number(t.currentValue), 0) || 0;
    const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const totalEstBonus = targets?.reduce((sum: any, t: any) => sum + Number(t.estimatedBonus || 0), 0) || 0;

    const displayAchievement = targets?.length > 0 ? `%${overallProgress}` : (statsData?.stats?.achievement || '%0.0');
    const displayBonus = targets?.length > 0 ? `₺${totalEstBonus.toLocaleString('tr-TR')}` : (statsData?.stats?.bonus || '₺0,00');

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-full gap-6 bg-app">
            <ProfileHeader user={user} title="Aktif Görev" dataCount={activeTasksCount} dataLabel="Adet" />
            
            <div className="flex flex-col space-y-4 w-full flex-1">
                {/* Top Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Günlük Cirom</div>
                            <IconActivity className="w-3.5 h-3.5 text-primary opacity-50" />
                        </div>
                        <p className="text-xl font-black font-mono text-text-primary tracking-tight">₺{(turnover || 0).toLocaleString()}</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hedef (Ay)</div>
                            <IconTrendingUp className="w-3.5 h-3.5 text-state-info-text opacity-50" />
                        </div>
                        <p className="text-xl font-black font-mono text-text-primary tracking-tight">{displayAchievement}</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bekleyen Görev</div>
                            <IconClock className="w-3.5 h-3.5 text-state-warning-text opacity-50" />
                        </div>
                        <p className="text-xl font-black font-mono text-text-primary tracking-tight">{activeTasksCount}</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-emerald-100 flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-state-success-text uppercase tracking-widest">Kazanılan Prim</div>
                        </div>
                        <p className="text-xl font-black font-mono text-state-success-text tracking-tight">{displayBonus}</p>
                    </div>
                </div>

                {/* PDKS & Vardiya */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                    <div className="bg-white dark:bg-[#1e293b] rounded-[24px] ring-1 ring-slate-100 dark:ring-white/5 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 dark:bg-[#0f172a] px-5 py-4 border-none text-[10px] font-black uppercase tracking-widest text-text-primary flex items-center justify-between">
                            <h3 className="flex items-center gap-2"><IconZap className="w-3.5 h-3.5 text-text-muted" /> PDKS DOĞRULAMASI</h3>
                            {!pdksStatus?.isWorking && <span className="text-[9px] text-text-muted font-bold">KAPALI</span>}
                            {pdksStatus?.isWorking && <span className="w-1.5 h-1.5 rounded-full bg-state-success-text animate-pulse"></span>}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-center">
                            {!pdksStatus?.isWorking ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleQrCheckin} className="flex flex-col items-center justify-center gap-2 h-20 bg-surface-secondary hover:bg-surface-tertiary border border-default rounded-md outline-none transition-colors group">
                                        <Printer className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Ofis QR (Lokal)</span>
                                    </button>
                                    <button onClick={handleGpsCheckin} className="flex flex-col items-center justify-center gap-2 h-20 bg-surface-secondary hover:bg-surface-tertiary border border-default rounded-md outline-none transition-colors group">
                                        <Flag className="w-5 h-5 text-state-success-text group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Saha GPS (Dış)</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 bg-surface-tertiary border border-default p-4 rounded-md">
                                    <div className="flex-1">
                                        <p className="text-state-success-text font-black uppercase tracking-widest text-[9px] mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> VERİ DOĞRULANDI</p>
                                        <div className="text-xl font-mono font-black text-text-primary">
                                            {pdksStatus.activeSession?.checkIn ? new Date(pdksStatus.activeSession.checkIn).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                                        </div>
                                        <p className="text-text-secondary font-bold text-[9px] uppercase tracking-widest mt-1">
                                            {pdksStatus.activeSession?.locationIn?.mode === 'FIELD_GPS' ? 'PROTOKOL: GPS DOĞRULAMALI / SAHA' : 'PROTOKOL: QR DOĞRULAMALI / ŞUBE'}
                                        </p>
                                    </div>
                                    <button onClick={handleCheckout} className="h-10 px-6 bg-state-alert-text hover:bg-rose-700 text-white rounded-md font-black text-[10px] uppercase tracking-widest shadow-sm outline-none transition-colors border border-transparent">
                                        PASİFE AL
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] rounded-[24px] ring-1 ring-slate-100 dark:ring-white/5 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 dark:bg-[#0f172a] px-5 py-4 border-none text-[10px] font-black uppercase tracking-widest text-text-primary flex items-center gap-2">
                           <IconClock className="w-3.5 h-3.5 text-text-muted" /> SIRADAKİ VARDİYA
                        </div>
                        <div className="p-4 flex flex-col justify-center flex-1">
                        {shifts.length > 0 ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-surface-secondary border border-default rounded-md flex flex-col items-center justify-center font-black">
                                    <span className="text-[10px] uppercase font-mono">{new Date(shifts[0]?.start).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</span>
                                </div>
                                <div>
                                    <div className="text-[12px] font-black text-text-primary uppercase tracking-widest">{shifts[0]?.type} Vardiyası</div>
                                    <p className="text-[11px] font-mono font-bold text-text-secondary mt-1">
                                        {shifts[0]?.type === 'İzinli' ? 'Tam Gün İzinli' : `${new Date(shifts[0]?.start).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - ${new Date(shifts[0]?.end).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest py-4 bg-surface-secondary border border-dashed border-default rounded-md">
                                PLANLI VARDİYA BULUNMUYOR
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
            <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={onQrScan} />
        </div>
    );
};

// ─── TARGETS VIEW ────────────────────────────────────────────────────
const TargetsView = ({ targets, statsData, user }: any) => {
    const totalTarget = targets?.reduce((sum: any, t: any) => sum + Number(t.targetValue), 0) || 0;
    const totalActual = targets?.reduce((sum: any, t: any) => sum + Number(t.currentValue), 0) || 0;
    const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const totalEstBonus = targets?.reduce((sum: any, t: any) => sum + Number(t.estimatedBonus || 0), 0) || 0;
    const activeTargetsCount = targets?.filter((t: any) => t.status !== 'İptal' && t.currentValue < t.targetValue).length || 0;
    const completedTargetsCount = targets?.filter((t: any) => t.currentValue >= t.targetValue).length || 0;

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-[600px] h-[calc(100vh-280px)]">
            {/* COLUMN 1: Profile Summary */}
            <ProfileHeader user={user} title="Aktif Dönem Hedefleri" dataCount={targets?.length || 0} dataLabel="Adet Hedef" />

            {/* COLUMNS 2-4: The Content */}
            <div className="flex-1 overflow-y-auto flex flex-col space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
                        <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> İlerleme Başarısı</div>
                        <div className="text-xl font-black font-mono text-text-primary dark:text-white">%{overallProgress}</div>
                        <div className="w-full h-1.5 bg-surface-secondary dark:bg-slate-800 rounded-full mt-3 overflow-hidden border border-default">
                            <div className="h-full bg-state-success-text rounded-full transition-all duration-1000" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
                        <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-state-success-text" /> Ulaşılan Hedefler</div>
                        <div className="text-xl font-black font-mono text-text-primary dark:text-white">{completedTargetsCount}</div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
                        <div className="text-[10px] font-bold tracking-widest text-text-secondary uppercase mb-2 flex items-center gap-1.5"><IconActivity className="w-3.5 h-3.5 text-state-warning-text" /> Aktif Hedefler</div>
                        <div className="text-xl font-black font-mono text-text-primary dark:text-white">{activeTargetsCount}</div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-emerald-100 flex items-center gap-4">
                        <div className="text-[10px] font-bold tracking-widest text-state-success-text dark:text-emerald-400 uppercase mb-2 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Prim Hakedişi</div>
                        <div className="text-xl font-black font-mono text-state-success-text dark:text-emerald-400">₺{totalEstBonus.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-transparent min-h-[300px]">
                    <EnterpriseSectionHeader title="Dönemsel Performans Tablosu" icon="🎯" />
                    {targets?.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-bg/30 dark:bg-transparent">
                            <Target className="w-8 h-8 text-text-muted mb-3 opacity-50" />
                            <h3 className="text-[12px] font-bold text-text-secondary dark:text-slate-300 mb-1 uppercase tracking-widest">Hedef Ataması Bulunmuyor</h3>
                            <p className="text-[11px] text-text-muted font-semibold">Bu dönem için henüz sizin adınıza planlanmış bir performans hedefi yok.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scroll outline-none">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="bg-surface-secondary dark:bg-[#1e293b] sticky top-0 z-10 border-b border-default dark:border-white/5 shadow-enterprise">
                                    <tr>
                                        <th className="p-3 pl-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Hedef Türü</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Durum</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">KOTA (HEDEF)</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Cari Gerçekleşen</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest pr-4 w-48">Performans</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default bg-white dark:bg-[#0f172a]">
                                    {targets.map((t: any) => {
                                        const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                        const isCompleted = progress >= 100;

                                        return (
                                            <tr key={t.id} className="hover:bg-surface-secondary/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="p-3 pl-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${t.type === 'TURNOVER' ? 'bg-state-info-bg border border-state-info-border text-state-info-text' : 'bg-state-warning-bg border border-state-warning-border text-state-warning-text'}`}>
                                                            {t.type === 'TURNOVER' ? <DollarSign className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[12px] font-black text-text-primary dark:text-white uppercase tracking-widest truncate">
                                                                {t.title || (t.type === 'TURNOVER' ? 'Ciro Hedefi' : 'Aksiyon Hedefi')}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-text-secondary truncate mt-0.5 tracking-widest">
                                                                DÖNEM: {new Date(t.startDate).toLocaleDateString('tr-TR', {month:'2-digit', year:'2-digit'})} / {new Date(t.endDate).toLocaleDateString('tr-TR', {month:'2-digit', year:'2-digit'})}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 align-middle whitespace-nowrap">
                                                    {isCompleted ? (
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-state-success-bg text-state-success-text font-black text-[9px] uppercase tracking-widest rounded border border-state-success-border">
                                                            BAŞARILI
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-state-info-bg text-state-info-text font-black text-[9px] uppercase tracking-widest rounded border border-state-info-border">
                                                            DEVAM EDİYOR
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 align-middle text-[12px] font-black font-mono text-text-secondary dark:text-slate-300 text-right whitespace-nowrap">
                                                    {t.type === 'TURNOVER' ? `₺${Number(t.targetValue).toLocaleString()}` : `${t.targetValue}`}
                                                </td>
                                                <td className="p-3 align-middle text-[13px] font-black font-mono text-state-success-text text-right whitespace-nowrap">
                                                    {t.type === 'TURNOVER' ? `₺${Number(t.currentValue).toLocaleString()}` : `${t.currentValue}`}
                                                </td>
                                                <td className="p-3 align-middle pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-surface-secondary dark:bg-slate-800 rounded-full overflow-hidden border border-default">
                                                            <div className={`h-full transition-all duration-500 rounded-full ${isCompleted ? 'bg-state-success-text' : 'bg-state-info-text'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                                                        </div>
                                                        <span className={`text-[10px] font-black font-mono w-8 text-right shrink-0 ${isCompleted ? 'text-state-success-text' : 'text-text-muted'}`}>%{progress}</span>
                                                    </div>
                                                    {t.estimatedBonus > 0 && (
                                                        <div className="mt-1.5 flex justify-end">
                                                            <span className="text-[9px] font-black text-state-success-text uppercase tracking-widest max-w-max border-b border-dashed border-state-success-text">HAKEDİŞ: ₺{Number(t.estimatedBonus).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── TASKS VIEW ──────────────────────────────────────────────────────
const TasksView = ({ user, tasks, fetchTasks, loading }: any) => {
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [feedback, setFeedback] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [filterStatus, setFilterStatus] = useState('Devam Edenler');
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 10;

    const handleSendFeedback = async (statusOverride?: string) => {
        if (!selectedTask) return;
        setIsUpdating(true);
        try {
            if (feedback.trim()) {
                await fetch(`/api/staff/tasks/${selectedTask.id}/feedback`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: feedback, isFromStaff: true })
                });
            }
            if (statusOverride) {
                await fetch(`/api/staff/tasks/${selectedTask.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: statusOverride })
                });
            }
            toast.success("Görev bilgileri iletildi!");
            setFeedback('');
            fetchTasks();
            setSelectedTask(null);
        } catch(e) { toast.error("İşlem başarısız."); }
        finally { setIsUpdating(false); }
    };

    const filteredTasks = tasks.filter((t: any) => {
        if (filterStatus === 'Tümü') return true;
        if (filterStatus === 'Tamamlandı') return t.status === 'Tamamlandı';
        return t.status !== 'Tamamlandı' && t.status !== 'İptal';
    });
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-[600px] h-[calc(100vh-280px)]">
            <ProfileHeader user={user} title="Atanmış Aktif Görevler" dataCount={tasks.filter((t: any) => t.status !== 'Tamamlandı' && t.status !== 'İptal').length} dataLabel="Görev" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-auto">
                <div className="lg:col-span-1 h-full flex flex-col">
                <EnterpriseCard className="h-full flex flex-col min-h-[400px]">
                    <EnterpriseSectionHeader title="Atanan Görevlerim" icon="📋" />
                    <div className="p-3 border-b border-divider bg-surface-secondary/50 dark:bg-slate-800/10 shrink-0">
                        <div className="flex bg-surface-tertiary dark:bg-slate-800 p-1 rounded-sm border border-default">
                            {['Devam Edenler', 'Tamamlandı', 'Tümü'].map((status) => (
                                <button key={status} onClick={() => { setFilterStatus(status); setCurrentPage(1); setSelectedTask(null); }} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all ${filterStatus === status ? 'bg-surface dark:bg-slate-700 text-primary dark:text-blue-400 shadow-sm border border-default' : 'text-text-secondary hover:text-text-primary dark:hover:text-slate-300 border border-transparent'}`}>
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? <p className="text-center text-xs text-text-muted p-8">Yükleniyor...</p> : 
                            paginatedTasks.length === 0 ? <p className="text-center text-xs font-semibold text-text-muted p-8">Belirtilen duruma uygun görev yok.</p> :
                            <div className="divide-y divide-default">
                                {paginatedTasks.map((task: any) => (
                                    <button key={task.id} onClick={() => setSelectedTask(task)} className={`w-full text-left p-4 transition-all block ${selectedTask?.id === task.id ? 'bg-primary/5 dark:bg-blue-500/10' : 'bg-surface hover:bg-surface-secondary dark:bg-slate-800 dark:hover:bg-slate-800/80'}`}>
                                        <div className={`text-[12px] font-black mb-1.5 line-clamp-1 ${selectedTask?.id === task.id ? 'text-primary dark:text-blue-400' : 'text-text-primary dark:text-white'}`}>{task.title}</div>
                                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                                            <span className={task.status === 'Tamamlandı' ? 'text-state-success-text' : task.status === 'İptal' ? 'text-text-muted' : 'text-state-warning-text'}>{task.status}</span>
                                            <span className="flex items-center gap-1 text-text-muted"><Flag className="w-3 h-3"/> {task.priority}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        }
                    </div>
                    {totalPages > 1 && (
                        <div className="p-3 border-t border-divider flex justify-between text-[10px] items-center font-bold text-text-secondary bg-surface-secondary/50 shrink-0">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-surface dark:bg-slate-700 border border-default rounded-sm hover:bg-surface-secondary disabled:opacity-50 transition-colors">GERİ</button>
                            <span className="font-mono tracking-widest text-[9px]">SAYFA {currentPage} / {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-surface dark:bg-slate-700 border border-default rounded-sm hover:bg-surface-secondary disabled:opacity-50 transition-colors">İLERİ</button>
                        </div>
                    )}
                </EnterpriseCard>
            </div>
            <div className="lg:col-span-2 h-full flex flex-col">
                <EnterpriseCard className="h-full flex flex-col min-h-[400px]">
                    <EnterpriseSectionHeader title="Görev Rapor Merkezi" icon="📝" />
                    {!selectedTask ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-text-muted text-[11px] font-black uppercase tracking-widest text-center border-t border-default bg-surface-bg/30">
                            ← LİSTEDEN BİR GÖREV SEÇEREK RAPOR EKRANINI AÇIN
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden bg-surface dark:bg-[#0f172a] shadow-inner">
                            <div className="p-5 border-b border-default bg-surface-secondary/40 shrink-0">
                                <h2 className="text-[14px] font-black text-text-primary">{selectedTask.title}</h2>
                                {selectedTask.dueDate && <span className="flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase text-state-alert-text bg-state-alert-bg/50 px-2 py-1 w-max rounded-sm border border-state-alert-border"><Calendar className="w-3.5 h-3.5"/> Son Teslim: {new Date(selectedTask.dueDate).toLocaleDateString()}</span>}
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
                                {selectedTask.description && (
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-transparent shrink-0">
                                        <div className="text-[9px] uppercase font-black text-text-muted mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Görev Detayı / Açıklama</div>
                                        <div className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">{selectedTask.description}</div>
                                    </div>
                                )}
                                <div className="space-y-4 flex-1">
                                    <div className="text-[9px] uppercase font-black text-text-muted flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/> Rapor & Yorum Akışı</div>
                                    {selectedTask.feedbacks?.length === 0 ? <p className="text-[10px] text-text-muted italic border-l-2 border-default pl-3">Henüz geri bildirim ya da rapor eklenmemiş.</p> : 
                                        <div className="space-y-3">
                                            {selectedTask.feedbacks?.map((fb: any) => (
                                                <div key={fb.id} className={`p-4 rounded-sm border max-w-[85%] ${fb.isFromStaff ? 'bg-surface-secondary dark:bg-slate-800/80 ml-auto border-default' : 'bg-primary/5 dark:bg-blue-500/10 border-primary/20'}`}>
                                                    <div className={`flex justify-between items-center mb-1.5 text-[9px] font-black text-text-muted uppercase tracking-widest ${fb.isFromStaff && 'flex-row-reverse'}`}>
                                                        <span className={fb.isFromStaff ? 'text-primary dark:text-blue-400' : 'text-text-secondary'}>{fb.isFromStaff ? user?.name : 'Yönetim / İK'}</span>
                                                        <span>{new Date(fb.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}</span>
                                                    </div>
                                                    <p className="text-[12px] text-text-primary dark:text-slate-200 whitespace-pre-wrap">{fb.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    }
                                </div>
                            </div>
                            <div className="p-4 border-t border-default bg-surface shrink-0 z-10 sticky bottom-0">
                                {selectedTask.status === 'Tamamlandı' ? (
                                    <div className="bg-state-success-bg/30 text-state-success-text font-black text-[11px] uppercase tracking-widest p-4 text-center rounded-sm border border-state-success-border flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4"/> BU GÖREV BAŞARIYLA TAMAMLANDI
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <textarea className="w-full h-16 bg-surface-secondary dark:bg-slate-800 rounded-sm p-3 text-[12px] border border-default focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none outline-none custom-scrollbar transition-all" placeholder="Görevle ilgili raporunuzu veya yorumunuzu buraya yazın..." value={feedback} onChange={e => setFeedback(e.target.value)} />
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleSendFeedback()} disabled={isUpdating || !feedback.trim()} className="flex-1 bg-surface-tertiary hover:bg-surface-secondary py-2.5 rounded-sm text-[10px] font-black uppercase disabled:opacity-50 text-text-primary border border-default transition-all">Sadece Yorum Bırak</button>
                                            <button onClick={() => handleSendFeedback('Tamamlandı')} disabled={isUpdating} className="flex-1 bg-state-success-text hover:bg-emerald-600 focus:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-sm text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-sm transition-all border border-transparent">
                                                <CheckCircle2 className="w-3.5 h-3.5"/> GÖREVİ TAMAMLA
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
        </div>
    );
};

// ─── LEAVES VIEW ─────────────────────────────────────────────────────
const LeavesView = ({ user, leaves, fetchLeaves, loading }: any) => {
    const [type, setType] = useState('Yıllık İzin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [printableLeave, setPrintableLeave] = useState<any>(null);

    const handleSubmit = async () => {
        if (!startDate || !endDate) return toast.error("Tarihleri doldurunuz.");
        const _s = new Date(startDate); const _e = new Date(endDate);
        if (_s > _e) return toast.error("Bitiş tarihi başlangıçtan önce olamaz.");
        
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/staff/leaves', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: user.id, type, startDate, endDate, reason,
                    days: Math.ceil(Math.abs(_e.getTime() - _s.getTime()) / (1000 * 60 * 60 * 24)) + 1
                })
            });
            if (res.ok) {
                toast.success("Talebiniz İK'ya ulaştı.");
                setStartDate(''); setEndDate(''); setReason(''); fetchLeaves();
            } else toast.error("Hata oluştu.");
        } finally { setIsSubmitting(false); }
    };

    const handlePrint = (leave: any) => {
        setPrintableLeave(leave);
        setTimeout(() => window.print(), 200);
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-[600px] h-[calc(100vh-280px)]">
            <style>{printStyles}</style>
            
            <ProfileHeader user={user} title="Onay Bekleyen Talep" dataCount={leaves.filter((l: any) => l.status === 'Bekliyor').length} dataLabel="Adet" />
            
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* INVISIBLE PRINT CONTAINER */}
                <div id="printable-area" className="hidden">
                    {printableLeave && (
                        <div className="p-10 font-[serif] text-black">
                            <h2 className="text-center text-xl font-bold uppercase mb-10 border-b-2 border-black pb-4">İzin Talep Formu / Dilekçesi</h2>
                            <div className="text-right mb-10">Tarih: {new Date(printableLeave.createdAt).toLocaleDateString('tr-TR')}</div>
                            <p className="text-lg mb-8 leading-relaxed">
                                Kurumunuzda sicil numaralı personeli <strong>{user?.name}</strong> olarak görev yapmaktayım.<br/><br/>
                                <strong>{new Date(printableLeave.startDate).toLocaleDateString('tr-TR')}</strong> ile <strong>{new Date(printableLeave.endDate).toLocaleDateString('tr-TR')}</strong> tarihleri arasında 
                                toplam <strong>{printableLeave.days} gün</strong> süreyle <strong>{printableLeave.type}</strong> kullanmak hususunda gereğini;
                            </p>
                            <p className="text-lg mt-6">Bilgilerinize arz ederim.</p>
                            <div className="mt-16 text-right w-full flex justify-end">
                                <div className="w-[300px] text-center">
                                    <p className="font-bold underline mb-16">İmza</p>
                                    <p className="font-bold">{user?.name}</p>
                                </div>
                            </div>
                            <div className="mt-20 border-t border-dashed border-black pt-4">
                                <h3 className="font-bold">İK Onayı / Bildirimi</h3>
                                <p className="mt-2">Sistem Durumu: {printableLeave.status}</p>
                                <p>Onaylayan: {printableLeave.approvedBy || '______________'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* FORM COLUMN */}
                <div className="w-[350px] shrink-0 no-print flex flex-col h-full">
                    <EnterpriseCard className="h-full flex flex-col min-h-[400px]">
                        <EnterpriseSectionHeader title="Yeni Talep Oluştur" icon="📝" />
                        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                            <EnterpriseSelect label="İzin Türü" value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="Yıllık İzin">Yıllık Ücretli İzin</option>
                                <option value="Mazeret İzni">Mazeret İzni</option>
                                <option value="Sağlık İzni">Sağlık İzni</option>
                                <option value="Ücretsiz İzin">Ücretsiz İzin</option>
                            </EnterpriseSelect>
                            <div className="grid grid-cols-2 gap-3">
                                <EnterpriseInput label="Başlangıç Seçimi" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                <EnterpriseInput label="Bitiş Seçimi" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <EnterpriseTextarea label="Dilekçe İçeriği / E-Posta Notu" placeholder="Ek açıklama..." rows={6} value={reason} onChange={e => setReason(e.target.value)} />
                        </div>
                        <div className="p-4 border-t border-default bg-surface shrink-0">
                            <EnterpriseButton variant="primary" className="w-full text-[10px] tracking-widest font-black" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "GÖNDERİLİYOR..." : "DİLEKÇEYİ ONAYA SUN"}
                            </EnterpriseButton>
                        </div>
                    </EnterpriseCard>
                </div>
                
                {/* TABLE COLUMN */}
                <div className="flex-1 min-w-0 no-print flex flex-col h-full">
                    <EnterpriseCard className="h-full flex flex-col min-h-[400px]">
                        <EnterpriseSectionHeader title="İzin Sicilim" icon="🕒" />
                        <div className="flex-1 overflow-y-auto custom-scroll outline-none">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-surface-secondary dark:bg-[#1e293b] sticky top-0 z-10 border-b border-default shadow-sm">
                                    <tr>
                                        <th className="p-3 pl-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Belge & Tür</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Tarih Aralığı / Süre</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Sistem Durumu</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Aksiyoner (İK)</th>
                                        <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest text-right pr-4">Belge İşlemi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default bg-white dark:bg-[#0f172a]">
                                    {loading ? <tr><td colSpan={5} className="py-8 text-center text-xs text-text-muted">Yükleniyor...</td></tr> : 
                                     leaves.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-xs text-text-muted uppercase tracking-widest">Arşivde evrak yok.</td></tr> :
                                     leaves.map((leave: any) => (
                                         <tr key={leave.id} className="hover:bg-surface-secondary/50 dark:hover:bg-slate-800/10 transition-colors">
                                             <td className="p-3 pl-4 align-middle">
                                                 <div className="text-[12px] font-black text-text-primary dark:text-white mb-0.5 uppercase tracking-widest">{leave.type}</div>
                                                 <div className="text-[9px] text-text-muted font-bold font-mono tracking-widest uppercase">DOC: {leave.id.slice(0,8)}</div>
                                             </td>
                                             <td className="p-3 align-middle">
                                                 <div className="text-[11px] font-black text-text-secondary dark:text-slate-300">
                                                     {new Date(leave.startDate).toLocaleDateString('tr-TR', {month:'2-digit', day:'2-digit', year:'numeric'})} - {new Date(leave.endDate).toLocaleDateString('tr-TR', {month:'2-digit', day:'2-digit', year:'numeric'})}
                                                 </div>
                                                 <div className="mt-0.5 flex items-center gap-1 text-[9px] font-black text-primary tracking-widest uppercase"><Calendar className="w-3.5 h-3.5"/> Toplam: {leave.days} Gün</div>
                                             </td>
                                             <td className="p-3 align-middle">
                                                 <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${
                                                     leave.status === 'Onaylandı' ? 'bg-state-success-bg text-state-success-text border-state-success-border' :
                                                     leave.status === 'Reddedildi' ? 'bg-state-alert-bg text-state-alert-text border-state-alert-border' : 'bg-state-warning-bg text-state-warning-text border-state-warning-border'
                                                 }`}>{leave.status}</span>
                                             </td>
                                             <td className="p-3 align-middle text-[11px] font-bold text-text-secondary uppercase">{leave.approvedBy || '-'}</td>
                                             <td className="p-3 align-middle pr-4 text-right">
                                                 <button onClick={() => handlePrint(leave)} className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary border border-default rounded-sm text-[9px] font-black text-text-primary uppercase tracking-widest inline-flex items-center justify-center gap-1.5 transition-colors">
                                                     <Printer className="w-3.5 h-3.5"/> Dilekçe Çıktı
                                                 </button>
                                             </td>
                                         </tr>
                                     ))}
                                </tbody>
                            </table>
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </div>
    );
};

// ─── PAYROLL VIEW ───────────────────────────────────────────────────
const PayrollView = ({ payrolls, user }: any) => {
    const [printablePayroll, setPrintablePayroll] = useState<any>(null);

    const handlePrint = (pr: any) => {
        setPrintablePayroll(pr);
        setTimeout(() => window.print(), 200);
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-[600px] h-[calc(100vh-280px)]">
            <style>{printStyles}</style>

            <ProfileHeader user={user} title="Toplam Bordro Kaydı" dataCount={payrolls.length} dataLabel="Ay" />

            {/* INVISIBLE PRINT CONTAINER */}
            <div id="printable-area" className="hidden">
                {printablePayroll && (
                    <div className="p-10 font-sans text-black border-2 border-slate-800 m-8 rounded-xl shadow-none">
                        <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter">Bordro Pusulası</h1>
                                <p className="text-sm font-bold mt-2 uppercase text-slate-600">Dönem: {printablePayroll.period}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="font-bold text-lg">{user?.name}</h3>
                                <p className="text-sm">Personel ID: {user?.id.slice(0, 8)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-12 border-b-2 border-slate-900 pb-8">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-divider pb-2"><span className="font-bold">Brüt Kesinleşmiş Maaş:</span> <span>₺{Number(printablePayroll.basePay).toLocaleString()}</span></div>
                                <div className="flex justify-between border-b border-divider pb-2"><span className="font-bold">Performans / Prim Eklentisi:</span> <span className="text-state-success-text">+ ₺{Number(printablePayroll.bonus).toLocaleString()}</span></div>
                                <div className="flex justify-between border-b border-divider pb-2"><span className="font-bold">Özel Kesintiler:</span> <span className="text-state-error-text">- ₺{Number(printablePayroll.deductions).toLocaleString()}</span></div>
                            </div>
                            <div className="bg-surface-secondary p-6 rounded-xl border border-default flex flex-col justify-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Net Ödenecek Hakediş</span>
                                <span className="text-4xl font-black text-text-primary">₺{Number(printablePayroll.netPay).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="text-sm font-medium text-slate-600 text-center italic mt-20">
                            Bu belge sistem tarafından otomatik oluşturulmuştur. <br/>
                            Durum: <strong>{printablePayroll.status || 'HESAPLANDI'}</strong>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <EnterpriseCard className="no-print h-full flex flex-col min-h-[400px]">
                    <EnterpriseSectionHeader title="Geçmiş Bordro ve Hakedişlerim" icon="💎" />
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-surface-secondary dark:bg-[#1e293b] sticky top-0 z-10 border-b border-default shadow-sm">
                                <tr>
                                    <th className="p-3 pl-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Dönem & Referans</th>
                                    <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Net Hakediş (TRY)</th>
                                    <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Brüt & Ek Nitelikler</th>
                                    <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Sistem & İşlem Durumu</th>
                                    <th className="p-3 text-[10px] font-black text-text-muted uppercase tracking-widest text-right pr-4">Belge Görüntüleme</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default bg-white dark:bg-[#0f172a]">
                                {payrolls.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-[11px] font-black uppercase text-text-muted tracking-widest">Aktif bordro kaydı bulunmamaktadır.</td></tr> :
                                    payrolls.map((pr: any) => (
                                        <tr key={pr.id} className="hover:bg-surface-secondary/50 dark:hover:bg-slate-800/10 transition-colors">
                                            <td className="p-3 pl-4 align-middle">
                                                <div className="text-[12px] font-black text-text-primary dark:text-white mb-0.5">{pr.period}</div>
                                                <div className="text-[9px] text-text-muted font-bold font-mono tracking-widest uppercase">REF:{pr.id.slice(0,8)}</div>
                                            </td>
                                            <td className="p-3 align-middle text-[12px] font-black text-state-success-text tracking-tight">₺{Number(pr.netPay).toLocaleString('tr-TR')}</td>
                                            <td className="p-3 align-middle">
                                                <div className="text-[10px] font-bold text-text-secondary">Brüt: ₺{Number(pr.basePay).toLocaleString('tr-TR')}</div>
                                                <div className="text-[10px] font-bold text-primary mt-0.5">Aylık Prim: + ₺{Number(pr.bonus).toLocaleString('tr-TR')}</div>
                                            </td>
                                            <td className="p-3 align-middle">
                                                 <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${pr.status === 'Ödendi' ? 'bg-state-success-bg text-state-success-text border-state-success-border' : 'bg-surface-secondary text-text-muted border-default'}`}>{pr.status || 'Bekliyor'}</span>
                                            </td>
                                            <td className="p-3 align-middle pr-4 text-right">
                                                <button onClick={() => handlePrint(pr)} className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary border border-default rounded-sm text-[9px] font-black text-text-primary uppercase tracking-widest inline-flex items-center justify-center gap-1.5 transition-colors">
                                                    <Printer className="w-3.5 h-3.5"/> Pusula Çıktı
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
};

// ─── SHIFTS VIEW ─────────────────────────────────────────────────────
const ShiftsView = ({ shifts, user }: any) => {
    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-[600px] h-[calc(100vh-280px)]">
            <ProfileHeader user={user} title="Haftalık Planlanmış" dataCount={shifts.length} dataLabel="Vardiya" />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <EnterpriseCard className="h-full flex flex-col min-h-[400px]">
                    <EnterpriseSectionHeader title="Haftalık Vardiya Planım" icon="📅" />
                    <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-surface dark:bg-[#0f172a]">
                        {shifts.length === 0 ? (
                            <div className="py-12 text-center text-[11px] font-black uppercase tracking-widest text-text-muted border border-dashed border-default rounded-sm bg-surface-bg/30">
                                İlgili dönem içi planlanmış vardiya planı bulunmuyor.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {shifts.map((s: any) => {
                                    const isPermit = s.type === 'İzinli';
                                    return (
                                        <div key={s.id} className={`p-4 rounded-2xl flex flex-col justify-between border border-transparent shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] h-[100px] relative overflow-hidden transition-all hover:shadow-sm ${isPermit ? 'bg-state-warning-bg/30 border-state-warning-border' : 'bg-surface-secondary border-default hover:border-primary/30 dark:bg-slate-800/50'}`}>
                                            <div className="flex justify-between items-start z-10 w-full mb-3">
                                                <div>
                                                    <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isPermit ? 'text-state-warning-text' : 'text-text-secondary'}`}>{new Date(s.start).toLocaleDateString('tr-TR', { weekday: 'long' })}</div>
                                                    <div className={`text-[12px] font-black ${isPermit ? 'text-state-warning-text' : 'text-text-primary dark:text-white'}`}>{new Date(s.start).toLocaleDateString('tr-TR', { day:'2-digit', month: 'long', year: 'numeric' })}</div>
                                                </div>
                                                {isPermit ? <Calendar className="w-4 h-4 text-state-warning-text"/> : <Clock className="w-4 h-4 text-text-muted"/>}
                                            </div>
                                            <div className={`z-10 py-1.5 px-3 border rounded-sm flex items-center justify-center ${isPermit ? 'bg-state-warning-bg border-state-warning-border' : 'bg-surface border-default dark:bg-[#1e293b]'}`}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isPermit ? 'text-state-warning-text' : 'text-primary dark:text-blue-400'}`}>
                                                    {isPermit ? "TAM GÜN İZİNLİ" : `${new Date(s.start).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})} - ${new Date(s.end).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
};

// ─── PROFILE VIEW ────────────────────────────────────────────────────
const ProfileSettingsView = ({ user }: any) => {
    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-[600px] h-[calc(100vh-280px)]">
            <ProfileHeader user={user} title="Hesap Durumu" dataCount={"ONAYLI"} dataLabel="Kullanıcı" />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <EnterpriseCard className="h-full flex flex-col min-h-[400px]">
                    <EnterpriseSectionHeader title="Profil & Güvenlik Ayarları" icon="⚙️" />
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-surface dark:bg-[#0f172a]">
                        <div className="flex items-center gap-5 mb-6 border-b pb-6 border-default">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border border-transparent flex items-center justify-center text-xl font-black text-text-primary relative shadow-sm">
                                {user?.name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="text-[14px] font-black text-text-primary mb-1.5">{user?.name}</div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded border border-primary/20">{user?.role || 'Personel'}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted font-mono">SYS_ID: {user?.id?.slice(0,8).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <EnterpriseInput label="Tam Ad Soyad" defaultValue={user?.name} disabled />
                            <EnterpriseInput label="E-Posta Adresi" type="email" defaultValue={user?.email} disabled />
                            <EnterpriseInput label="Telefon Numarası" type="tel" placeholder="Ulaşım bilgisi sisteme kapalı / Güvenli Bölge" disabled />
                        </div>
                        <div className="pt-6 border-t border-default">
                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 mb-4"><Lock className="w-3.5 h-3.5"/> Sistem Parolasını Yenile</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <EnterpriseInput label="Mevcut Güvenlik Anahtarı (Şifre)" type="password" />
                                <EnterpriseInput label="Yeni Güvenlik Anahtarı (Şifre)" type="password" />
                            </div>
                            <div className="mt-5 flex justify-end">
                                <EnterpriseButton variant="primary" className="text-[10px] uppercase font-black tracking-widest px-8">KİMLİK BİLGİLERİNİ GÜNCELLE</EnterpriseButton>
                            </div>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
};

// ─── REPORTS VIEW ──────────────────────────────────────────────────────
const ReportsView = ({ user }: any) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/staff/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            const data = await res.json();
            if (res.ok) setReport(data);
            else setReport({ error: data.error || 'Bilinmeyen bir hata oluştu.' });
        } catch (err: any) {
            setReport({ error: err.message || 'Bağlantı hatası' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [dateRange]);

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-[600px] h-[calc(100vh-280px)]">
            <ProfileHeader user={user} title="Performans ve Aksiyon" dataCount="AKTİF" dataLabel="Analiz" />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <EnterpriseCard className="h-full flex flex-col min-h-[400px]">
                    <EnterpriseSectionHeader title="Dönemsel Operasyon Raporu & KPI" icon="📊" />
                    
                    <div className="p-4 border-b border-default bg-surface-secondary/50 shrink-0 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-3 w-full sm:w-auto">
                            <EnterpriseInput label="Operasyon Başlangıcı" type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                            <EnterpriseInput label="Operasyon Bitişi" type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                        </div>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-surface dark:bg-[#0f172a]">
                        {loading ? (
                            <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">Aksiyon verileri işleniyor...</div>
                        ) : report?.error ? (
                            <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-state-alert-text bg-state-alert-bg/30 rounded-sm border border-state-alert-border">
                                {report.error === 'Staff not found' ? 'Personel hesabı ile eşleştirilemedi.' : report.error}
                            </div>
                        ) : report?.summary ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-blue-100 flex items-center gap-4">
                                    <div className="flex justify-between items-center mb-3 text-blue-500 dark:text-blue-400">
                                        <TrendingUp className="w-5 h-5"/>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">Ciro / Toplam Satış</div>
                                    </div>
                                    <div className="text-[18px] font-black text-text-primary dark:text-white mb-1">₺{report.summary.totalSales.toLocaleString('tr-TR')}</div>
                                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{report.summary.salesCount} Başarılı İşlem</div>
                                </div>
                                
                                <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-emerald-100 flex items-center gap-4">
                                    <div className="flex justify-between items-center mb-3 text-emerald-500 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5"/>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">Nakit / Tahsilat</div>
                                    </div>
                                    <div className="text-[18px] font-black text-text-primary dark:text-white mb-1">₺{report.summary.totalCollections.toLocaleString('tr-TR')}</div>
                                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{report.summary.collectionsCount} Tamamlanan Tahsilat</div>
                                </div>
                                
                                <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-[100px] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
                                    <div className="flex justify-between items-center mb-3 text-text-secondary">
                                        <MapPin className="w-5 h-5"/>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">Aksiyon / Saha Ziyareti</div>
                                    </div>
                                    <div className="text-[18px] font-black text-text-primary dark:text-white mb-1">{report.summary.totalVisits} Müşteri Ziyareti</div>
                                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Saha Temas Raporu</div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────
export default function PersonelPanel() {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'targets' | 'tasks' | 'reports' | 'leave' | 'payroll' | 'shifts' | 'profile'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const [pdksStatus, setPdksStatus] = useState<any>(null);
    const [scanMode, setScanMode] = useState<'IN' | 'OUT'>('IN');
    const [targets, setTargets] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [shifts, setShifts] = useState<any[]>([]);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [turnover, setTurnover] = useState(0);

    const fetchCoreData = async () => {
        try {
            const userId = currentUser?.id;
            if (!userId) return;
            const today = new Date();
            const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay() + 1); startOfWeek.setHours(0,0,0,0);
            const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23,59,59,999);

            const [hrRes, targetsRes, shiftsRes, payrollRes, tasksRes, leavesRes, tnrRes] = await Promise.all([
                fetch('/api/hr/performance/dashboard').then(r => r.json()),
                fetch(`/api/staff/targets?mine=true`).then(r => r.json()),
                fetch(`/api/staff/shifts?mine=true&start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`).then(r => r.json()),
                fetch(`/api/staff/payroll?mine=true`).then(r => r.json()),
                fetch(`/api/staff/tasks?mine=true`).then(r => r.json()),
                fetch(`/api/staff/leaves?mine=true`).then(r => r.json()),
                fetch(`/api/staff/me/turnover`).then(r => r.json())
            ]);

            if (hrRes.success) setStatsData(hrRes.data);
            if (Array.isArray(targetsRes)) setTargets(targetsRes);
            else if (targetsRes?.targets && Array.isArray(targetsRes.targets)) setTargets(targetsRes.targets);
            if (Array.isArray(shiftsRes)) setShifts(shiftsRes);
            if (payrollRes?.payrolls) setPayrolls(payrollRes.payrolls);
            if (Array.isArray(tasksRes)) setTasks(tasksRes);
            if (Array.isArray(leavesRes)) setLeaves(leavesRes);
            if (tnrRes.success) setTurnover(tnrRes.turnover);
        } catch (e) { console.error(e); }
    };

    const fetchPdksStatus = async () => {
        try {
            const res = await fetch("/api/staff/me/pdks-status");
            const data = await res.json();
            if (data.success) setPdksStatus(data);
        } catch (e) { console.error("pdks err", e); }
    };

    const getFingerprint = () => btoa(navigator.userAgent + screen.width + screen.height).slice(0, 32);

    const handleQrCheckin = () => { setScanMode('IN'); setIsScannerOpen(true); };
    const onQrScan = async (token: string) => {
        toast.loading("Giriş yapılıyor...", { id: "pdks" });
        try {
            const res = await fetch(scanMode === 'IN' ? "/api/v1/pdks/check-in" : "/api/v1/pdks/check-out", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "OFFICE_QR", qrToken: token, deviceFp: getFingerprint(), clientTime: new Date().toISOString(), offlineId: uuidv4() })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(scanMode === 'IN' ? "Ofis Girişi Başarılı!" : "Ofis Çıkışı Yapıldı!", { id: "pdks" });
                setIsScannerOpen(false); fetchPdksStatus();
            } else toast.error(data.error || "Hata", { id: "pdks" });
        } catch (err) { toast.error("Bağlantı hatası", { id: "pdks" }); }
    };

    const handleGpsCheckin = () => {
        if (!navigator.geolocation) return toast.error("Desteklenmiyor");
        toast.loading("Saha konumu alınıyor...", { id: "gps" });
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch("/api/v1/pdks/check-in", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mode: "FIELD_GPS", deviceFp: getFingerprint(), clientTime: new Date().toISOString(), location: { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }, offlineId: uuidv4() })
                });
                const data = await res.json();
                if (data.success) { toast.success("Saha Girişi Alındı!", { id: "gps" }); fetchPdksStatus(); }
                else toast.error(data.error || "Hata", { id: "gps" });
            } catch (err) { toast.error("Bağlantı hatası", { id: "gps" }); }
        }, () => toast.error("Konum izni verin", { id: "gps" }), { enableHighAccuracy: true });
    };

    const handleCheckout = () => {
        toast.custom((t: any) => (
            <div className="bg-white p-4 rounded-xl shadow-xl max-w-[300px] border border-slate-200">
                <p className="font-bold text-slate-900 mb-3 text-sm">Çıkış Yönteminizi Seçin</p>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { toast.dismiss(t); setScanMode('OUT'); setIsScannerOpen(true); }} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg">Ofis TR (QR)</button>
                    <button onClick={() => { 
                        toast.dismiss(t); 
                        if (!navigator.geolocation) return toast.error("Tarayıcı engeli");
                        toast.loading("Saha çıkış konumu...", { id: "g_out" });
                        navigator.geolocation.getCurrentPosition(async (pos) => {
                            const res = await fetch("/api/v1/pdks/check-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "FIELD_GPS", deviceFp: getFingerprint(), clientTime: new Date().toISOString(), location: { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }, offlineId: uuidv4() })});
                            const data = await res.json();
                            if(data.success) { toast.success("Çıkış Onaylandı!", { id: "g_out" }); fetchPdksStatus(); } else toast.error("Reddedildi", {id:"g_out"});
                        }, () => {}, { enableHighAccuracy: true });
                    }} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg">Saha (GPS)</button>
                </div>
            </div>
        ), { duration: 8000 });
    };

    useEffect(() => {
        fetchPdksStatus();
        if (currentUser?.id) fetchCoreData();
        const t = setTimeout(() => setLoading(false), 900);
        return () => clearTimeout(t);
    }, [currentUser?.id]);

    if (loading) return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-pulse">
            <div className="h-20 bg-slate-100 dark:bg-slate-800/30 rounded-2xl w-full" />
            <div className="h-64 bg-slate-100 dark:bg-slate-800/30 rounded-2xl w-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24 no-print relative">
    <div className="max-w-[1700px] mx-auto p-6 md:p-8 space-y-8 duration-700">
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-transparent">
    {[
        { id: 'dashboard', label: 'Özet / PDKS' }, { id: 'tasks', label: 'Görevler' }, { id: 'targets', label: 'Hedefler' }, { id: 'reports', label: 'Raporlar' },
        { id: 'shifts', label: 'Vardiya' }, { id: 'leave', label: 'İzinler' }, { id: 'payroll', label: 'Bordro' }, { id: 'profile', label: 'Profil' }
    ].map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id
                ? "px-5 py-2.5 text-[12px] font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-white/10 rounded-[16px] transition-all"
                : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[16px] border border-transparent"
            }
        >
            {tab.label}
        </button>
    ))}
</div>
{activeTab === 'dashboard' && <DashboardView handleQrCheckin={handleQrCheckin} handleGpsCheckin={handleGpsCheckin} isScannerOpen={isScannerOpen} setIsScannerOpen={setIsScannerOpen} onQrScan={onQrScan} pdksStatus={pdksStatus} handleCheckout={handleCheckout} targets={targets} statsData={statsData} turnover={turnover} shifts={shifts} payrolls={payrolls} tasks={tasks} user={currentUser} />}
                {activeTab === 'targets' && <TargetsView targets={targets} statsData={statsData} user={currentUser} />}
                {activeTab === 'tasks' && <TasksView user={currentUser} tasks={tasks} fetchTasks={fetchCoreData} loading={loading} />}
                {activeTab === 'reports' && <ReportsView user={currentUser} />}
                {activeTab === 'leave' && <LeavesView user={currentUser} leaves={leaves} fetchLeaves={fetchCoreData} loading={loading} />}
                {activeTab === 'payroll' && <PayrollView payrolls={payrolls} user={currentUser} />}
                {activeTab === 'shifts' && <ShiftsView shifts={shifts} user={currentUser} />}
                {activeTab === 'profile' && <ProfileSettingsView user={currentUser} />}
            </div>
            {/* Branding Footer */}
            <div style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)' }} className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center no-print">
                <div className="max-w-[1600px] mx-auto w-full flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>© 2026 PERIODYA OS • İNSAN KAYNAKLARI</span>
                    <span className="text-blue-500 font-black">🔒 Verileriniz Uçtan Uca Şifrelenmiştir</span>
                </div>
            </div>
        </div>
    );
}
