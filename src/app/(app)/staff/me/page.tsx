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
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
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
    <div className={`bg-white dark:bg-[#1e293b]/50 rounded-[32px] p-6 lg:p-8 flex flex-col ${className} ring-0 border-none shadow-none`}>
        {title && (
            <div className="flex items-center gap-2 mb-6 text-[12px] font-black uppercase tracking-widest text-slate-500">
                <span className="text-slate-400">{icon}</span>
                <h3>{title}</h3>
            </div>
        )}
        <div className="flex-1">
            {children}
        </div>
    </div>
);

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
                <div className="flex flex-wrap items-center gap-3 shrink-0 mb-6 w-full">
                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-blue-500 shadow-sm border-none">
                            <IconActivity className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Günlük Cirom</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">₺{(turnover || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-emerald-500 shadow-sm border-none">
                            <IconTrendingUp className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Hedef (Ay)</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayAchievement}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-orange-500 shadow-sm border-none">
                            <IconClock className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Bekleyen Görev</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{activeTasksCount}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/5 dark:bg-[#1e293b] rounded-[100px] pl-2 pr-6 py-2 items-center gap-4 w-max border-none shadow-none ring-0 transition-transform cursor-default">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 flex flex-shrink-0 items-center justify-center text-purple-500 shadow-sm border-none">
                            <DollarSign className="w-5 h-5"/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Kazanılan Prim</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayBonus}</span>
                        </div>
                    </div>
                </div>

                {/* PDKS & Vardiya */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                    <div className="bg-white dark:bg-[#1e293b]/50 rounded-[32px] border-none ring-0 shadow-none overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"><IconZap className="w-3.5 h-3.5 text-text-muted" /> PDKS DOĞRULAMASI</h3>
                            {!pdksStatus?.isWorking && <span className="text-[9px] text-text-muted font-bold">KAPALI</span>}
                            {pdksStatus?.isWorking && <span className="w-1.5 h-1.5 rounded-full bg-state-success-text animate-pulse"></span>}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-center">
                            {!pdksStatus?.isWorking ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleQrCheckin} className="flex items-center justify-center gap-3 h-16 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[24px] outline-none transition-colors group border-none ring-0">
                                        <Printer className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Ofis QR (Lokal)</span>
                                    </button>
                                    <button onClick={handleGpsCheckin} className="flex items-center justify-center gap-3 h-16 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[24px] outline-none transition-colors group border-none ring-0">
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
                                    <button onClick={handleCheckout} className="h-10 px-6 bg-state-alert-text hover:bg-rose-700 text-white rounded-md font-black text-[10px] uppercase tracking-widest shadow-none outline-none transition-colors border border-transparent">
                                        PASİFE AL
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b]/50 rounded-[32px] border-none ring-0 shadow-none overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
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
                            <thead>
                                <tr>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">HEDEF TÜRÜ</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">DURUM</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 dark:border-slate-800/50">KOTA / GERÇEKLEŞEN</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48 border-b border-slate-100 dark:border-slate-800/50 pr-4 text-right">PERFORMANS BARI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                {targets.map((t: any) => {
                                    const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                    const isCompleted = progress >= 100;
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <td className="py-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        {t.type === 'TURNOVER' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{t.title || 'Hedef'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">DÖNEM: {new Date(t.startDate).toLocaleDateString('tr-TR')} - {new Date(t.endDate).toLocaleDateString('tr-TR')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 align-middle">
                                                {isCompleted ? <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">BAŞARILI</span> : <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">DEVAM EDİYOR</span>}
                                            </td>
                                            <td className="py-4 align-middle text-right">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-white">{t.type === 'TURNOVER' ? `₺${Number(t.currentValue).toLocaleString()}` : t.currentValue}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">/ {t.type === 'TURNOVER' ? `₺${Number(t.targetValue).toLocaleString()}` : t.targetValue}</div>
                                            </td>
                                            <td className="py-4 align-middle pr-4">
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
                <SoftContainer title="Bana Atanan Görevler" icon={<Briefcase className="w-5 h-5"/>} className="min-h-[400px]">
                    <div className="flex gap-2 mb-6">
                        <button onClick={() => setSubTab('pending')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors border-none ring-0 shadow-none ${subTab==='pending' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}>Devam Edenler</button>
                        <button onClick={() => setSubTab('completed')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors border-none ring-0 shadow-none ${subTab==='completed' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}>Tamamlandı</button>
                    </div>
                    {displayTasks.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">GÖREV BULUNMUYOR</h4>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {displayTasks.map((t: any) => (
                                <div key={t.id} className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors border-none ring-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-snug pr-4">{t.title}</div>
                                        {t.priority === 'HIGH' && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full shrink-0">YÜKSEK</span>}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.status}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </SoftContainer>

                <SoftContainer title="Görev Rapor Merkezi" icon={<FileText className="w-5 h-5"/>} className="min-h-[400px]">
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
                                <thead className="bg-surface-secondary dark:bg-[#1e293b] sticky top-0 z-10 border-b border-default shadow-none">
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
                            <thead className="bg-surface-secondary dark:bg-[#1e293b] sticky top-0 z-10 border-b border-default shadow-none">
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
                                        <div key={s.id} className={`p-4 rounded-2xl flex flex-col justify-between border border-transparent shadow-none h-[100px] relative overflow-hidden transition-all hover:shadow-none ${isPermit ? 'bg-state-warning-bg/30 border-state-warning-border' : 'bg-surface-secondary border-default hover:border-primary/30 dark:bg-slate-800/50'}`}>
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
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border border-transparent flex items-center justify-center text-xl font-black text-text-primary relative shadow-none">
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
                                <div className="bg-white dark:bg-[#1e293b]/50 px-5 py-3 rounded-[100px] shadow-none ring-0 ring-0-100 flex items-center gap-4">
                                    <div className="flex justify-between items-center mb-3 text-blue-500 dark:text-blue-400">
                                        <TrendingUp className="w-5 h-5"/>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">Ciro / Toplam Satış</div>
                                    </div>
                                    <div className="text-[18px] font-black text-text-primary dark:text-white mb-1">₺{report.summary.totalSales.toLocaleString('tr-TR')}</div>
                                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{report.summary.salesCount} Başarılı İşlem</div>
                                </div>
                                
                                <div className="bg-white dark:bg-[#1e293b]/50 px-5 py-3 rounded-[100px] shadow-none ring-0 ring-0-100 flex items-center gap-4">
                                    <div className="flex justify-between items-center mb-3 text-emerald-500 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5"/>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">Nakit / Tahsilat</div>
                                    </div>
                                    <div className="text-[18px] font-black text-text-primary dark:text-white mb-1">₺{report.summary.totalCollections.toLocaleString('tr-TR')}</div>
                                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{report.summary.collectionsCount} Tamamlanan Tahsilat</div>
                                </div>
                                
                                <div className="bg-white dark:bg-[#1e293b]/50 px-5 py-3 rounded-[100px] shadow-none border-none ring-0 flex items-center gap-4">
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
                                ? "px-5 py-2 text-[12px] font-bold text-slate-800 dark:text-white bg-white dark:bg-white/5 rounded-lg transition-all border-none ring-0 shadow-none"
                                : "px-5 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all rounded-lg border-none ring-0 shadow-none"
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
