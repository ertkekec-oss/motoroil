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
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-2">
                <span className="text-slate-500">{label}</span>
                <span style={{ color }}>%{percentage.toFixed(0)}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full ">
                <div className="h-full transition-all duration-1000 ease-out rounded-full" style={{ width: `${percentage}%`, background: color }} />
            </div>
            <div className="flex justify-end text-[9px] text-slate-400 mt-1 font-bold">
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


const TopPills = ({ pills }: any) => (
    <div className="flex flex-wrap items-center gap-3 shrink-0 mb-6 w-full">
        {pills.map((p: any, i: number) => (
            <div key={i} className="flex bg-white dark:bg-[#1e293b]/50 rounded-[100px] pl-3 pr-6 py-2.5 items-center gap-4 w-max transition-transform cursor-default ring-0 border-none shadow-none">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.bg} ${p.color}`}>
                    {p.icon}
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">{p.title}</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">{p.value}</span>
                </div>
            </div>
        ))}
    </div>
);

const SoftContainer = ({ title, icon, children, className="" }: any) => (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden flex flex-col ${className}`}>
        {title && (
            <div className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-6 py-3 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20 flex items-center gap-2">
                {icon && <span className="opacity-70">{icon}</span>}
                {title}
            </div>
        )}
        <div className="flex-1 overflow-auto custom-scroll w-full relative">
            {children}
        </div>
    </div>
);

// ─── DASHBOARD VIEW ──────────────────────────────────────────────────
const DashboardView = ({
    handleQrCheckin, handleGpsCheckin, isScannerOpen, setIsScannerOpen, onQrScan, pdksStatus, handleCheckout,
    targets = [], statsData, turnover, shifts = [], payrolls = [], tasks = [], user
}: any) => {
    const activeTasksCount = tasks?.filter((t: any) => t.status !== 'Tamamlandı' && t.status !== 'İptal').length || 0;
    const totalTarget = targets?.reduce((sum: any, t: any) => sum + Number(t.targetValue), 0) || 0;
    const totalActual = targets?.reduce((sum: any, t: any) => sum + Number(t.currentValue), 0) || 0;
    const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const totalEstBonus = targets?.reduce((sum: any, t: any) => sum + Number(t.estimatedBonus || 0), 0) || 0;

    const displayAchievement = targets?.length > 0 ? `%${overallProgress}` : (statsData?.stats?.achievement || '%0.0');
    const displayBonus = targets?.length > 0 ? `₺${totalEstBonus.toLocaleString('tr-TR')}` : (statsData?.stats?.bonus || '₺0,00');

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-full gap-6">
            <div className="flex flex-wrap items-center gap-4 shrink-0 mb-4 w-full">
                <div className="flex bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-blue-500">
                        <IconActivity className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Günlük Cirom</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">₺{(turnover || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-emerald-500">
                        <IconTrendingUp className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Hedef (Ay)</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayAchievement}</span>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-orange-500">
                        <IconClock className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Bekleyen Görev</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{activeTasksCount}</span>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-purple-500">
                        <DollarSign className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Kazanılan Prim</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayBonus}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 px-1">
                {/* 1. PDKS BOX */}
                <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500"><IconZap className="w-4 h-4" /> PDKS DOĞRULAMASI</h3>
                        {!pdksStatus?.isWorking ? <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">KAPALI</span> : <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-white"></span>}
                     </div>
                     <div className="bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm p-8 flex flex-col justify-center min-h-[160px]">
                        {!pdksStatus?.isWorking ? (
                            <div className="flex gap-4 w-full">
                                <button onClick={handleQrCheckin} className="flex-1 flex flex-col items-center justify-center gap-3 h-24 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 rounded-[12px] border border-slate-100 dark:border-white/5 outline-none transition-all group">
                                    <Printer className="w-5 h-5 text-slate-500 dark:text-slate-300 group-hover:text-blue-600 transition-colors" />
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-widest group-hover:text-blue-600">Ofis QR (Lokal)</span>
                                </button>
                                <button onClick={handleGpsCheckin} className="flex-1 flex flex-col items-center justify-center gap-3 h-24 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 rounded-[12px] border border-slate-100 dark:border-white/5 outline-none transition-all group">
                                    <Flag className="w-5 h-5 text-slate-500 dark:text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-widest group-hover:text-emerald-600">Saha GPS (Dış)</span>
                                </button>
                            </div>
                        ) : (
                                <div className="flex justify-between items-center w-full px-2">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-md w-max border border-emerald-200">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500"></div> DOĞRULANDI
                                        </p>
                                        <div className="text-2xl font-black text-slate-800">
                                            {pdksStatus.activeSession?.checkIn ? new Date(pdksStatus.activeSession.checkIn).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                                        </div>
                                    </div>
                                    <button onClick={handleCheckout} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-sm outline-none transition-colors">
                                        🏁 Çıkış Yap
                                    </button>
                                </div>
                        )}
                     </div>
                </div>

                {/* 2. VARDİYA BOX */}
                <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500"><IconClock className="w-4 h-4" /> SIRADAKİ VARDİYA</h3>
                     </div>
                     <div className="bg-white dark:bg-[#0f172a] rounded-[20px] border border-slate-200 dark:border-white/5 shadow-sm p-8 flex flex-col justify-center min-h-[160px]">
                        {(!shifts || shifts.length === 0) ? (
                            <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                PLANLI VARDİYA BULUNMUYOR
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center">
                                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-white">{new Date(shifts[0]?.start).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{shifts[0]?.type} Vardiyası</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase">
                                        {shifts[0]?.type === 'İzinli' ? 'Tam Gün İzinli' : `${new Date(shifts[0]?.start).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - ${new Date(shifts[0]?.end).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}`}
                                    </div>
                                </div>
                            </div>
                        )}
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
    const activeTargetsCount = targets?.filter((t: any) => t.status !== 'İptal' && t.currentValue < t.targetValue).length || 0;
    const completedTargetsCount = targets?.filter((t: any) => t.currentValue >= t.targetValue).length || 0;

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <TopPills pills={[
                { title: 'AKTİF HEDEFLER', value: activeTargetsCount, icon: <Target className="w-5 h-5"/>, bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500' },
                { title: 'ULAŞILAN HEDEFLER', value: completedTargetsCount, icon: <CheckCircle2 className="w-5 h-5"/>, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500' },
                { title: 'GENEL BAŞARI', value: `%${overallProgress}`, icon: <TrendingUp className="w-5 h-5"/>, bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500' }
            ]} />

            <SoftContainer title="Dönemsel Performans Tablosu" icon={<Target className="w-5 h-5" />} className="min-h-[400px]">
                {targets?.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <Target className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">HEDEF ATAMASI BULUNMUYOR</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Bu dönem için henüz planlanmış bir performans hedefi yok.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 pl-6 font-bold border-b border-slate-200 dark:border-white/5">HEDEF TÜRÜ</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">DURUM</th>
                                    <th className="px-4 py-3 text-right font-bold border-b border-slate-200 dark:border-white/5">KOTA / GERÇEKLEŞEN</th>
                                    <th className="px-4 py-3 pr-6 text-right font-bold w-48 border-b border-slate-200 dark:border-white/5">PERFORMANS BARI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {targets.map((t: any) => {
                                    const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                    const isCompleted = progress >= 100;
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[64px] group">
                                            <td className="px-4 py-3 pl-6 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-white/5">
                                                        {t.type === 'TURNOVER' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none">{t.title || 'Hedef'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">DÖNEM: {new Date(t.startDate).toLocaleDateString('tr-TR')} - {new Date(t.endDate).toLocaleDateString('tr-TR')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                                                    <div className={`w-1 h-1 rounded-full mr-1.5 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                                    {isCompleted ? 'BAŞARILI' : 'DEVAM EDİYOR'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-right">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-white">
                                                    {t.type === 'TURNOVER' ? `₺${Number(t.currentValue).toLocaleString()}` : t.currentValue}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                    / {t.type === 'TURNOVER' ? `₺${Number(t.targetValue).toLocaleString()}` : t.targetValue}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle pr-6">
                                                <ProgressBar label="" value={t.currentValue} max={t.targetValue} color={isCompleted ? "#10b981" : "#3b82f6"} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </SoftContainer>
            <div className="h-10"></div>
        </div>
    );
};

// ─── TASKS VIEW ──────────────────────────────────────────────────────
const TasksView = ({ user, tasks=[], fetchTasks, loading }: any) => {
    const [subTab, setSubTab] = useState<'pending' | 'completed' | 'all'>('pending');
    
    const displayTasks = tasks.filter((t: any) => {
        if (subTab === 'pending') return t.status !== 'Tamamlandı' && t.status !== 'İptal';
        if (subTab === 'completed') return t.status === 'Tamamlandı';
        return true;
    });

    const pendingCount = tasks.filter((t: any) => t.status !== 'Tamamlandı' && t.status !== 'İptal').length || 0;
    const completedCount = tasks.filter((t: any) => t.status === 'Tamamlandı').length || 0;

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <TopPills pills={[
                { title: 'BEKLEYEN GÖREV', value: pendingCount, icon: <Clock className="w-5 h-5"/>, bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500' },
                { title: 'TAMAMLANAN', value: completedCount, icon: <CheckCircle2 className="w-5 h-5"/>, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500' }
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <SoftContainer title="Bana Atanan Görevler" icon={<Briefcase className="w-4 h-4"/>} className="min-h-[400px]">
                    <div className="px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a] flex gap-2 shrink-0">
                        <button onClick={() => setSubTab('pending')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${subTab==='pending' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 hover:bg-slate-200'}`}>Devam Edenler</button>
                        <button onClick={() => setSubTab('completed')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${subTab==='completed' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 hover:bg-slate-200'}`}>Tamamlandı</button>
                    </div>
                    {displayTasks.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">GÖREV BULUNMUYOR</h4>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 pl-6 font-bold border-b border-slate-200 dark:border-white/5">GÖREV BİLGİSİ</th>
                                    <th className="px-4 py-3 pr-6 font-bold border-b border-slate-200 dark:border-white/5 text-right">ÖNCELİK & DURUM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {displayTasks.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[54px] group cursor-pointer">
                                        <td className="px-4 py-3 pl-6 align-middle">
                                            <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-snug">{t.title}</div>
                                        </td>
                                        <td className="px-4 py-3 pr-6 align-middle text-right flex justify-end">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.status}</span>
                                                {t.priority === 'HIGH' && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded border border-red-100 dark:border-red-500/20">YÜKSEK</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </SoftContainer>

                <SoftContainer title="Görev Rapor Merkezi" icon={<FileText className="w-4 h-4"/>} className="min-h-[400px]">
                    <div className="flex-1 flex items-center justify-center flex-col text-slate-400 gap-3 text-center py-20">
                        <MessageSquare className="w-10 h-10 opacity-30 mb-2" />
                        <h4 className="text-[12px] font-black uppercase tracking-widest mt-2 block leading-none">LİSTEDEN BİR GÖREV SEÇEREK RAPOR EKRANINI AÇIN</h4>
                    </div>
                </SoftContainer>
            </div>
            <div className="h-10"></div>
        </div>
    );
};

// ─── LEAVES VIEW ──────────────────────────────────────────────────────
const LeavesView = ({ user }: any) => {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('Yıllık İzin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [printableLeave, setPrintableLeave] = useState<any>(null);

    const fetchLeaves = async () => {
        try { const res = await fetch(`/api/staff/leaves?staffId=${user.id}`); const d = await res.json(); setLeaves(d || []); }
        catch (e) { } finally { setLoading(false); }
    };
    useEffect(() => { if (user?.id) fetchLeaves(); }, [user]);

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) return toast.error("Tüm alanları doldurunuz.");
        const _s = new Date(startDate); const _e = new Date(endDate);
        if (_s > _e) return toast.error("Bitiş tarihi başlangıçtan önce olamaz.");
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/staff/leaves', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId: user.id, type, startDate, endDate, reason, days: Math.ceil(Math.abs(_e.getTime() - _s.getTime()) / (1000 * 60 * 60 * 24)) + 1 })
            });
            if (res.ok) { toast.success("Talebiniz İK'ya ulaştı."); setStartDate(''); setEndDate(''); setReason(''); fetchLeaves(); }
        } finally { setIsSubmitting(false); }
    };

    const handlePrint = (leave: any) => { setPrintableLeave(leave); setTimeout(() => window.print(), 200); };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 gap-6">
            <style>{printStyles}</style>

            <div className="flex gap-6 items-start">
                {/* 1. YENİ TALEP KUTUSU */}
                <div className="w-[380px] shrink-0 bg-white dark:bg-[#0f172a] rounded-[20px] p-8 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col gap-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><Calendar className="w-4 h-4"/></div>
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">YENİ TALEP OLUŞTUR</h3>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">İzin Türü</span>
                           <select className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[8px] border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-500 shadow-sm" value={type} onChange={e=>setType(e.target.value)}>
                               <option value="Yıllık İzin">Yıllık Ücretli İzin</option><option value="Mazeret İzni">Mazeret İzni</option><option value="Sağlık İzni">Sağlık İzni</option><option value="Ücretsiz İzin">Ücretsiz İzin</option>
                           </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex flex-col gap-1.5">
                               <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Başlangıç Seçimi</span>
                               <input type="date" className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[8px] border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-500 shadow-sm" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
                           </div>
                           <div className="flex flex-col gap-1.5">
                               <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Bitiş Seçimi</span>
                               <input type="date" className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[8px] border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-500 shadow-sm" value={endDate} onChange={e=>setEndDate(e.target.value)}/>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Dilekçe İçeriği / E-Posta Notu</span>
                           <textarea className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[8px] border border-slate-200 px-3 py-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-500 shadow-sm resize-none h-24" placeholder="Ek açıklama..." value={reason} onChange={e=>setReason(e.target.value)}></textarea>
                        </div>

                        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-[36px] bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center transition-colors shadow-sm">
                            {isSubmitting ? 'GÖNDERİLİYOR...' : 'DİLEKÇEYİ ONAYA SUN'}
                        </button>
                    </div>
                </div>

                {/* 2. İZİN SİCİL TABLOSU - HR REFERANS KOPYASI */}
                <div className="flex-1 min-w-0 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="overflow-auto custom-scroll">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                                <tr>
                                    <th className="px-4 py-3 pl-6 font-bold border-b border-slate-200 dark:border-white/5">BELGE & TÜR</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">TARİH ARALIĞI / SÜRE</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">SİSTEM DURUMU</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">AKSİYONER (İK)</th>
                                    <th className="px-4 py-3 pr-6 font-bold text-right border-b border-slate-200 dark:border-white/5">BELGE İŞLEMİ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {(!leaves || leaves.length === 0) ? (
                                    <tr><td colSpan={5} className="py-16 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">ARŞİVDE EVRAK YOK.</td></tr> 
                                ) : (
                                    leaves.map((l: any) => (
                                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[54px] group">
                                            <td className="px-4 py-3 pl-6 align-middle">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#334155]/50 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase border border-slate-200 dark:border-white/5 whitespace-nowrap">{l.type}</span>
                                                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap font-mono">DOC: {l.id.substring(0,8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className="text-[12px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{new Date(l.startDate).toLocaleDateString('tr-TR')} - {new Date(l.endDate).toLocaleDateString('tr-TR')}</div>
                                                <div className="text-[11px] text-slate-500 font-medium">Toplam: {l.days} Gün</div>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${l.status === 'Onaylandı' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : l.status === 'Reddedildi' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                                    <div className={`w-1 h-1 rounded-full mr-1.5 ${l.status === 'Onaylandı' ? 'bg-emerald-500' : l.status === 'Reddedildi' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                                                    {l.status}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase">{l.approvedBy || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 pr-6 align-middle text-right">
                                                <button onClick={() => handlePrint(l)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b] opacity-50 group-hover:opacity-100 flex items-center justify-end gap-1.5 ml-auto">
                                                    <Printer className="w-3 h-3"/> ÇIKTI
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
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
        <div className="flex flex-col animate-in fade-in duration-500  ">
            <ProfileHeader user={user} title="Performans ve Aksiyon" dataCount="AKTİF" dataLabel="Analiz" />
            
            <div className="flex-1 flex flex-col ">
                <SoftContainer title="Dönemsel Operasyon Raporu & KPI" icon={<TrendingUp className="w-4 h-4" />} className="h-full flex flex-col min-h-[400px]">
                    
                    
                    <div className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/10 shrink-0 flex flex-col sm:flex-row gap-4 justify-between items-center p-6">
                        <div className="flex gap-3 w-full sm:w-auto">
                            <EnterpriseInput label="Operasyon Başlangıcı" type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                            <EnterpriseInput label="Operasyon Bitişi" type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                        </div>
                    </div>

                    <div className="p-6 flex-1 bg-white dark:bg-[#0f172a]">
                        {loading ? (
                            <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Aksiyon verileri işleniyor...</div>
                        ) : report?.error ? (
                            <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl">
                                {report.error === 'Staff not found' ? 'Personel hesabı ile eşleştirilemedi.' : report.error}
                            </div>
                        ) : report?.summary ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center mb-3 text-blue-500 dark:text-blue-400">
                                        <TrendingUp className="w-5 h-5"/>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ciro / Toplam Satış</div>
                                    </div>
                                    <div className="text-[20px] font-black text-slate-800 dark:text-white mt-2">₺{report.summary.totalSales.toLocaleString('tr-TR')}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{report.summary.salesCount} Başarılı İşlem</div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center mb-3 text-emerald-500 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5"/>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nakit / Tahsilat</div>
                                    </div>
                                    <div className="text-[20px] font-black text-slate-800 dark:text-white mt-2">₺{report.summary.totalCollections.toLocaleString('tr-TR')}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{report.summary.collectionsCount} Tamamlanan Tahsilat</div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-[#1e293b]/50 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center mb-3 text-text-secondary">
                                        <MapPin className="w-5 h-5"/>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aksiyon / Saha Ziyareti</div>
                                    </div>
                                    <div className="text-[20px] font-black text-slate-800 dark:text-white mt-2">{report.summary.totalVisits} Müşteri Ziyareti</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saha Temas Raporu</div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </SoftContainer>
            </div>
        </div>
    );
};

// ─── PAYROLL VIEW ──────────────────────────────────────────────────────
const PayrollView = ({ payrolls, user }: any) => {
    const [printablePayroll, setPrintablePayroll] = useState<any>(null);

    const handlePrint = (pr: any) => {
        setPrintablePayroll(pr);
        setTimeout(() => window.print(), 200);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <style>{printStyles}</style>

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
                                <p className="text-sm">Personel ID: {user?.id?.slice(0, 8)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-12 border-b-2 border-black pb-8">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2"><span className="font-bold">Brüt Kesinleşmiş Maaş:</span> <span>₺{Number(printablePayroll.basePay).toLocaleString()}</span></div>
                                <div className="flex justify-between border-b pb-2"><span className="font-bold">Performans / Prim Eklentisi:</span> <span className="text-green-700">+ ₺{Number(printablePayroll.bonus).toLocaleString()}</span></div>
                                <div className="flex justify-between border-b pb-2"><span className="font-bold">Özel Kesintiler:</span> <span className="text-red-700">- ₺{Number(printablePayroll.deductions).toLocaleString()}</span></div>
                            </div>
                            <div className="bg-slate-100 p-6 rounded-xl border border-slate-300 flex flex-col justify-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Net Ödenecek Hakediş</span>
                                <span className="text-4xl font-black">₺{Number(printablePayroll.netPay).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="text-sm font-medium text-slate-600 text-center italic mt-20">
                            Bu belge sistem tarafından otomatik oluşturulmuştur. <br/>
                            Durum: <strong>{printablePayroll.status || 'HESAPLANDI'}</strong>
                        </div>
                    </div>
                )}
            </div>

            <SoftContainer className="min-h-[400px]" title="Geçmiş Bordro ve Hakedişlerim" icon={<DollarSign className="w-4 h-4" />}>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 pl-6 font-bold border-b border-slate-200 dark:border-white/5">DÖNEM</th>
                                <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">NET HAKEDİŞ (TRL)</th>
                                <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">BRÜT + PRİM / KESİNTİ</th>
                                <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-white/5">DURUM & İŞLEM Z.</th>
                                <th className="px-4 py-3 pr-6 font-bold text-right border-b border-slate-200 dark:border-white/5">EYLEM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {payrolls.length === 0 ? <tr><td colSpan={5} className="py-16 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Aktif bordro kaydı bulunmamaktadır.</td></tr> :
                                payrolls.map((pr: any) => (
                                    <tr key={pr.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[64px] group">
                                        <td className="px-4 py-3 pl-6 align-middle text-[12px] font-black tracking-widest uppercase text-slate-800 dark:text-white">{pr.period}</td>
                                        <td className="px-4 py-3 align-middle text-[14px] font-black text-emerald-600">₺{Number(pr.netPay).toLocaleString()}</td>
                                        <td className="px-4 py-3 align-middle text-[10px] font-bold text-slate-500 uppercase tracking-widest space-y-1">
                                            <div>Brüt: ₺{Number(pr.basePay).toLocaleString()}</div>
                                            <div className="text-blue-500">Prim: ₺{Number(pr.bonus).toLocaleString()} </div>
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                             <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${pr.status === 'Ödendi' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 dark:border-white/5'}`}>{pr.status || 'BEKLİYOR'}</span>
                                        </td>
                                        <td className="px-4 py-3 pr-6 align-middle text-right flex justify-end">
                                            <button onClick={() => handlePrint(pr)} className="px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-colors border border-blue-100 dark:border-blue-500/20">
                                                <Printer className="w-3.5 h-3.5"/> PUSULA YAZDIR
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </SoftContainer>
        </div>
    );
};

// ─── SHIFTS VIEW ───────────────────────────────────────────────────────
const ShiftsView = ({ shifts }: any) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <SoftContainer className="min-h-[400px]" title="Haftalık Vardiya Planım" icon={<Calendar className="w-4 h-4" />}>
                <div className="p-6">
                    {shifts.length === 0 ? (
                        <div className="py-16 text-center flex flex-col items-center">
                            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">PLANLANMIŞ VARDİYA YOK</h4>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {shifts.map((s: any) => {
                                const isPermit = s.type === 'İzinli';
                                return (
                                    <div key={s.id} className={`p-5 rounded-[20px] border flex flex-col justify-between h-[120px] relative overflow-hidden transition-colors ${isPermit ? 'bg-amber-50/50 border-amber-200/50' : 'bg-slate-50/50 border-slate-200 dark:bg-slate-800/30 dark:border-white/5'}`}>
                                        <div className="flex justify-between items-start z-10 w-full mb-3">
                                            <div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${isPermit ? 'text-amber-600' : 'text-slate-400'}`}>{new Date(s.start).toLocaleDateString('tr-TR', { weekday: 'long' })}</div>
                                                <div className={`text-[14px] font-black tracking-widest uppercase mt-0.5 ${isPermit ? 'text-amber-900' : 'text-slate-800 dark:text-white'}`}>{new Date(s.start).toLocaleDateString('tr-TR', { day:'2-digit', month: '2-digit' })}</div>
                                            </div>
                                        </div>
                                        <div className="z-10 mt-auto items-center flex gap-2">
                                            {isPermit ? <span className="text-[14px]">🏖️</span> : <span className="text-[14px]">🏢</span>}
                                            <span className={`text-[11px] font-black tracking-widest uppercase ${isPermit ? 'text-amber-700' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {isPermit ? "TAM GÜN İZİNLİ" : `${new Date(s.start).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})} - ${new Date(s.end).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SoftContainer>
        </div>
    );
};

// ─── PROFILE VIEW ──────────────────────────────────────────────────────
const ProfileSettingsView = ({ user }: any) => {
    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <SoftContainer title="Profil & Güvenlik Ayarları" icon={<Lock className="w-4 h-4"/>} className="border-none ring-0 shadow-sm min-h-[400px]">
                
                <div className="p-8">
                    <div className="flex items-center gap-6 mb-8 border-b pb-8 border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white relative shadow-md">
                            {user?.name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                            <h4 className="text-[20px] font-black text-slate-800 dark:text-white mb-2">{user?.name}</h4>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md">{user?.role || 'Personel'}</span>
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">ŞİRKET ID NO: #{user?.id?.slice(0,6)?.toUpperCase()}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <EnterpriseInput label="Tam Ad Soyad" defaultValue={user?.name} disabled />
                        <EnterpriseInput label="E-Posta Adresi" type="email" defaultValue={user?.email} disabled />
                        <EnterpriseInput label="Telefon Numarası" type="tel" placeholder="Ulaşım bilgisi sisteme kapalı" disabled />
                    </div>
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6"><Lock className="w-4 h-4"/> Parola Güncelle</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EnterpriseInput label="Mevcut Şifre" type="password" />
                            <EnterpriseInput label="Yeni Şifre" type="password" />
                        </div>
                        <div className="mt-8 flex justify-end">
                            <EnterpriseButton variant="primary" className="px-10 text-[11px] font-black tracking-widest uppercase">BİLGİLERİ GÜNCELLE</EnterpriseButton>
                        </div>
                    </div>
                </div>
            </SoftContainer>
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
                                ? "px-5 py-2.5 text-[12px] font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-700 shadow-sm rounded-full transition-all border-none ring-0"
                                : "px-5 py-2.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all rounded-full border-none ring-0 shadow-none"
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
