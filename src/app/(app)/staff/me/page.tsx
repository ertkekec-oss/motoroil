"use client";

import { useState, useEffect, useRef } from 'react';
import { Calendar, MessageSquare, Briefcase, FileText, CheckCircle2, UserCircle, Flag, XCircle, ChevronRight, Printer, Target, TrendingUp, DollarSign } from 'lucide-react';
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
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span style={{ color }}>%{(percentage || 0).toFixed(0)}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
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
        <div className="w-full flex justify-between items-center h-auto bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-[16px] p-6 mb-6">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl font-black shadow-inner shrink-0">
                    {user?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{user?.name}</h3>
                    <p className="text-xs font-bold uppercase text-slate-500 mt-1 tracking-widest">{user?.role || 'Personel'}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Durum Göstergesi</div>
                    <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif Çalışan
                    </div>
                </div>
                <div className="h-10 w-px bg-slate-100 dark:bg-white/5 hidden sm:block"></div>
                <div className="text-right">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{title}</div>
                    <div className="text-[16px] font-black text-emerald-600 dark:text-emerald-400 mt-1">{dataCount} <span className="text-sm font-bold text-slate-400">{dataLabel}</span></div>
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
        <div className="flex flex-col animate-in fade-in duration-500 h-[calc(100vh-280px)] min-h-[600px]">
            <ProfileHeader user={user} title="Aktif Görev" dataCount={activeTasksCount} dataLabel="Adet" />
            
            <div className="flex flex-col space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {/* Top Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">
                    <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#3b82f6">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Günlük Cirom</h4>
                            <IconActivity className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₺{(turnover || 0).toLocaleString()}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-2">Bugünkü satış totali</p>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#8b5cf6">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hedef Gerçekleşme</h4>
                            <IconTrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{displayAchievement}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-2">Bu ayki hedef durumu</p>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#f59e0b">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Bekleyen Görev</h4>
                            <IconClock className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeTasksCount}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-2">Size atanmış aktif görev</p>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#10b981">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Kazanılan Prim</h4>
                            <IconZap className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{displayBonus}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-2">Dönem biriken tutar</p>
                    </EnterpriseCard>
                </div>

                {/* PDKS & Vardiya */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[300px]">
                    <EnterpriseCard className="h-full flex flex-col">
                        <EnterpriseSectionHeader title="PDKS Geçiş İşlemleri" icon="⚡" />
                        <div className="p-6 space-y-6 flex-1 flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-4">
                                {!pdksStatus?.isWorking ? (
                                    <>
                                        <button onClick={handleQrCheckin} className="flex flex-col items-center gap-3 p-6 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl transition-all group">
                                            <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform"><span className="text-2xl">📱</span></div>
                                            <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-center">Ofis Girişi (QR)</span>
                                        </button>
                                        <button onClick={handleGpsCheckin} className="flex flex-col items-center gap-3 p-6 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl transition-all group">
                                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform"><span className="text-2xl">📍</span></div>
                                            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-center">Saha Girişi (GPS)</span>
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={handleCheckout} className="col-span-2 flex flex-col items-center justify-center gap-3 p-8 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-xl transition-all group h-full">
                                        <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform"><span className="text-3xl">🏁</span></div>
                                        <span className="text-[13px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest text-center mt-2">MESAİYİ BİTİR (ÇIKIŞ YAP)</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-center pt-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400">📲 Konum ve cihaz parmak izi güvenli şekilde doğrulanır.</span>
                            </div>
                        </div>
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Sıradaki Vardiya Özetim" icon="⏰" />
                    <div className="p-6 flex flex-col justify-center h-[calc(100%-60px)] space-y-4">
                        {shifts.length > 0 ? (
                            <div className="flex items-center gap-4 p-5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex flex-col items-center justify-center font-black">
                                    <span className="text-xs">{new Date(shifts[0]?.start).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                                    <span className="text-lg">{new Date(shifts[0]?.start).toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{shifts[0]?.type} Vardiyası</h4>
                                    <p className="text-[12px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                                        {shifts[0]?.type === 'İzinli' ? 'Tam Gün İzinli' : `${new Date(shifts[0]?.start).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - ${new Date(shifts[0]?.end).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-sm font-semibold text-slate-400 py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                                Size atanmış yaklaşan vardiya bulunmuyor.
                            </div>
                        )}
                    </div>
                </EnterpriseCard>
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
            <div className="flex-1 overflow-y-auto flex flex-col bg-white dark:bg-[#0f172a] shadow-sm rounded-[16px] border border-slate-200 dark:border-white/5 p-6 space-y-6">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1e293b]/60 p-5 rounded-[12px] border border-slate-100 dark:border-white/5 shrink-0">
                    <div>
                        <h2 className="text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" />
                            Kişisel Hedef ve Performansım
                        </h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Bu dönemki hedeflerinizi ve komisyon hakedişlerinizi anlık takip edebilirsiniz.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] p-5 shadow-sm">
                        <h4 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-3 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> İlerleme Başarısı</h4>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">%{overallProgress}</div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] p-5 shadow-sm">
                        <h4 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Ulaşılan Hedefler</h4>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{completedTargetsCount}</div>
                    </div>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] p-5 shadow-sm">
                        <h4 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-3 flex items-center gap-1.5">🔥 Aktif Hedefler</h4>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{activeTargetsCount}</div>
                    </div>
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] p-5 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-[#0f172a]">
                        <h4 className="text-[11px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-3 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Prim (Tahmini)</h4>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₺{totalEstBonus.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] shrink-0">
                        <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Detaylı Hedef Tablosu</h3>
                    </div>
                    {targets?.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-transparent">
                            <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3 opacity-50" />
                            <h3 className="text-[14px] font-bold text-slate-600 dark:text-slate-300 mb-1">Hedef Ataması Bulunmuyor</h3>
                            <p className="text-[12px] text-slate-500">Bu dönem için henüz sizin adınıza planlanmış bir performans hedefi yok.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scroll outline-none">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] sticky top-0 z-10 border-b border-slate-200 dark:border-white/5 shadow-sm">
                                    <tr>
                                        <th className="p-3 pl-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Hedef Türü</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Durum</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">KOTA</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Cari Gerçekleşen</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest pr-4 w-48 backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Performans</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-[#0f172a]">
                                    {targets.map((t: any) => {
                                        const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                        const isCompleted = progress >= 100;

                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="p-3 pl-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'TURNOVER' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'}`}>
                                                            {t.type === 'TURNOVER' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                                                {t.type === 'TURNOVER' ? 'Ciro Hedefi' : 'Aksiyon Hedefi'} ({t.period})
                                                            </div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 truncate mt-0.5 tracking-widest">
                                                                {new Date(t.startDate).toLocaleDateString('tr-TR')} - {new Date(t.endDate).toLocaleDateString('tr-TR')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 align-middle whitespace-nowrap">
                                                    {isCompleted ? (
                                                        <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded border border-emerald-200 dark:border-emerald-500/30">
                                                            BAŞARILI
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase tracking-widest rounded border border-blue-200 dark:border-blue-500/30">
                                                            DEVAM EDİYOR
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 align-middle text-[13px] font-bold text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                                                    {t.type === 'TURNOVER' ? `₺${Number(t.targetValue).toLocaleString()}` : `${t.targetValue}`}
                                                </td>
                                                <td className="p-3 align-middle text-[13px] font-black text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                                                    {t.type === 'TURNOVER' ? `₺${Number(t.currentValue).toLocaleString()}` : `${t.currentValue}`}
                                                </td>
                                                <td className="p-3 align-middle pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                                                        </div>
                                                        <span className={`text-[11px] font-black w-9 text-right shrink-0 ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>%{progress}</span>
                                                    </div>
                                                    {t.estimatedBonus > 0 && (
                                                        <div className="mt-1 flex justify-end">
                                                            <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Hakediş: ₺{Number(t.estimatedBonus).toLocaleString()}</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                <div className="lg:col-span-1 border border-transparent">
                <EnterpriseCard className="h-full flex flex-col">
                    <EnterpriseSectionHeader title="Atanan Görevlerim" icon="📋" />
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-lg">
                            {['Devam Edenler', 'Tamamlandı', 'Tümü'].map((status) => (
                                <button key={status} onClick={() => { setFilterStatus(status); setCurrentPage(1); setSelectedTask(null); }} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${filterStatus === status ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loading ? <p className="text-center text-sm text-slate-400">Yükleniyor...</p> : 
                            paginatedTasks.length === 0 ? <p className="text-center text-sm font-semibold text-slate-400 p-8">Belirtilen duruma uygun görev yok.</p> :
                            paginatedTasks.map((task: any) => (
                                <button key={task.id} onClick={() => setSelectedTask(task)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTask?.id === task.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                    <h4 className="text-[13px] font-black text-slate-900 dark:text-white mb-2 line-clamp-1">{task.title}</h4>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                        <span className={task.status === 'Tamamlandı' ? 'text-emerald-600' : task.status === 'İptal' ? 'text-slate-500' : 'text-amber-500'}>{task.status}</span>
                                        <span className="flex items-center gap-1 text-slate-400"><Flag className="w-3 h-3"/> {task.priority}</span>
                                    </div>
                                </button>
                            ))
                        }
                    </div>
                    {totalPages > 1 && (
                        <div className="p-3 border-t flex justify-between text-[11px] font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 bg-white dark:bg-slate-700 border rounded">GERİ</button>
                            <span>Sayfa {currentPage} / {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 bg-white dark:bg-slate-700 border rounded">İLERİ</button>
                        </div>
                    )}
                </EnterpriseCard>
            </div>
            <div className="lg:col-span-2">
                <EnterpriseCard className="h-full flex flex-col">
                    <EnterpriseSectionHeader title="Görev Detayı & Rapor" icon="📝" />
                    {!selectedTask ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-50 text-slate-500 text-[13px] font-bold uppercase tracking-widest text-center">
                            ← LİSTEDEN BİR GÖREV SEÇEREK DETAYLARI VE BİLDİRİM EKRANINI AÇIN
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                                <h2 className="text-[18px] font-black">{selectedTask.title}</h2>
                                {selectedTask.dueDate && <span className="flex items-center gap-1.5 mt-2 text-[11px] font-bold uppercase text-rose-500 bg-rose-50 px-3 py-1.5 w-max rounded-lg border border-rose-200"><Calendar className="w-4 h-4"/> Son Teslim: {new Date(selectedTask.dueDate).toLocaleDateString()}</span>}
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {selectedTask.description && (
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border shadow-sm">
                                        <h4 className="text-[10px] uppercase font-black text-slate-500 mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Açıklama</h4>
                                        <p className="text-[13px] text-slate-700 dark:text-slate-300">{selectedTask.description}</p>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Rapor & Yorum Geçmişi</h4>
                                    {selectedTask.feedbacks?.length === 0 ? <p className="text-[11px] text-slate-400 italic">Henüz rapor girilmedi.</p> : 
                                        selectedTask.feedbacks?.map((fb: any) => (
                                            <div key={fb.id} className={`p-4 rounded-xl max-w-[85%] ${fb.isFromStaff ? 'bg-amber-50 dark:bg-amber-500/10 ml-auto border-amber-200 text-right' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200'}`}>
                                                <div className={`flex justify-between items-center mb-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest ${fb.isFromStaff && 'flex-row-reverse'}`}>
                                                    <span>{fb.isFromStaff ? user?.name : 'Yönetim / İK'}</span>
                                                    <span>{new Date(fb.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[13px] font-medium">{fb.content}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="p-4 border-t bg-white dark:bg-slate-900">
                                {selectedTask.status === 'Tamamlandı' ? (
                                    <div className="bg-emerald-50 text-emerald-600 font-bold p-4 text-center rounded-lg border flex justify-center gap-2"><CheckCircle2 className="w-5 h-5"/> BU GÖREV TAMAMLANDI</div>
                                ) : (
                                    <div className="space-y-3">
                                        <textarea className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-[13px] border focus:border-blue-500 resize-none" placeholder="Durum bildirimi/raporu yazın..." value={feedback} onChange={e => setFeedback(e.target.value)} />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSendFeedback()} disabled={isUpdating || !feedback.trim()} className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-lg text-[11px] font-black uppercase disabled:opacity-50">Sadece Yorum Gir</button>
                                            <button onClick={() => handleSendFeedback('Tamamlandı')} disabled={isUpdating} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-lg text-[11px] font-black uppercase flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4"/> GÖREVİ TAMAMLADIM</button>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
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

            <div className="lg:col-span-1 no-print">
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="Yeni Talep Oluştur" icon="📝" />
                    <div className="p-6 space-y-5">
                        <EnterpriseSelect label="İzin Türü" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="Yıllık İzin">Yıllık Ücretli İzin</option>
                            <option value="Mazeret İzni">Mazeret İzni</option>
                            <option value="Sağlık İzni">Sağlık İzni</option>
                            <option value="Ücretsiz İzin">Ücretsiz İzin</option>
                        </EnterpriseSelect>
                        <div className="grid grid-cols-2 gap-4">
                            <EnterpriseInput label="Başlangıç Seçimi" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <EnterpriseInput label="Bitiş Seçimi" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <EnterpriseTextarea label="Dilekçe İçeriği / E-Posta Notu" placeholder="Ek açıklama..." rows={4} value={reason} onChange={e => setReason(e.target.value)} />
                        <EnterpriseButton variant="primary" className="w-full mt-2" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "GÖNDERİLİYOR..." : "DİLEKÇEYİ ONAYA SUN"}
                        </EnterpriseButton>
                    </div>
                </EnterpriseCard>
            </div>
            
            <div className="lg:col-span-2 no-print">
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="İzin Sicilim" icon="🕒" />
                    <div className="p-6 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b">
                                    <th className="px-4 py-3">Belge & Tür</th>
                                    <th className="px-4 py-3">Tarih Aralığı / Süre</th>
                                    <th className="px-4 py-3">Sistem Durumu</th>
                                    <th className="px-4 py-3">Aksiyoner</th>
                                    <th className="px-4 py-3 text-right">Belge</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">Yükleniyor...</td></tr> : 
                                 leaves.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Arşivde evrak yok.</td></tr> :
                                 leaves.map((leave: any) => (
                                     <tr key={leave.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                                         <td className="px-4 py-4 text-[13px] font-bold">
                                             {leave.type}
                                             <div className="text-[10px] text-slate-400 font-medium">{leave.id.slice(0,8).toUpperCase()}</div>
                                         </td>
                                         <td className="px-4 py-4 text-[12px] font-medium text-slate-600 dark:text-slate-300">
                                             {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                             <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-500"><Calendar className="w-3 h-3"/> Toplam: {leave.days} Gün</div>
                                         </td>
                                         <td className="px-4 py-4">
                                             <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md ${
                                                 leave.status === 'Onaylandı' ? 'bg-emerald-100 text-emerald-700' :
                                                 leave.status === 'Reddedildi' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                             }`}>{leave.status}</span>
                                         </td>
                                         <td className="px-4 py-4 text-[11px] font-medium text-slate-500">{leave.approvedBy || '-'}</td>
                                         <td className="px-4 py-4 text-right">
                                             <button onClick={() => handlePrint(leave)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2 ml-auto">
                                                 <Printer className="w-3 h-3"/> Dilekçe Çıktı
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

            <div className="flex-1 flex flex-col overflow-hidden">
                <EnterpriseCard className="no-print h-full flex flex-col">
                    <EnterpriseSectionHeader title="Geçmiş Bordro ve Hakedişlerim" icon="💎" />
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[#f8fafc] dark:bg-[#0f111a] sticky top-0 z-10">
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-4 py-3">Dönem</th>
                                    <th className="px-4 py-3">Net Hakediş (TRL)</th>
                                    <th className="px-4 py-3">Brüt + Prim / Kesinti</th>
                                    <th className="px-4 py-3">Durum & İşlem Z.</th>
                                    <th className="px-4 py-3 text-right">Eylem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Aktif bordro kaydı bulunmamaktadır.</td></tr> :
                                    payrolls.map((pr: any) => (
                                        <tr key={pr.id} className="border-b transition hover:bg-slate-50 dark:hover:bg-slate-800/10">
                                            <td className="px-4 py-4 text-[14px] font-black">{pr.period}</td>
                                            <td className="px-4 py-4 text-[16px] font-black text-emerald-600">₺{Number(pr.netPay).toLocaleString()}</td>
                                            <td className="px-4 py-4 text-[11px] font-semibold text-slate-500 space-y-1">
                                                <div>Brüt: ₺{Number(pr.basePay).toLocaleString()}</div>
                                                <div className="text-blue-500">Prim: ₺{Number(pr.bonus).toLocaleString()} </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                 <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded ${pr.status === 'Ödendi' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{pr.status || 'Bekliyor'}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button onClick={() => handlePrint(pr)} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-2">
                                                    <Printer className="w-3 h-3"/> Pusula Yazdır
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
                <EnterpriseCard className="h-full flex flex-col">
                    <EnterpriseSectionHeader title="Haftalık Vardiya Planım" icon="📅" />
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        {shifts.length === 0 ? (
                            <div className="py-12 text-center text-[13px] font-bold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                                İlgili dönem içi planlanmış vardiya yok.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                                {shifts.map((s: any) => {
                                    const isPermit = s.type === 'İzinli';
                                    return (
                                        <div key={s.id} className={`p-5 rounded-2xl border flex flex-col justify-between h-32 relative overflow-hidden ${isPermit ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/50'}`}>
                                            <div className="flex justify-between items-start z-10">
                                                <div>
                                                    <div className={`text-[12px] font-bold uppercase tracking-widest ${isPermit ? 'text-amber-700' : 'text-slate-500'}`}>{new Date(s.start).toLocaleDateString('tr-TR', { weekday: 'long' })}</div>
                                                    <div className={`text-[16px] font-black ${isPermit ? 'text-amber-900' : 'text-slate-900 dark:text-white'}`}>{new Date(s.start).toLocaleDateString('tr-TR', { day:'2-digit', month: '2-digit' })}</div>
                                                </div>
                                                {isPermit ? <span className="text-xl">🌴</span> : <span className="text-xl">🏢</span>}
                                            </div>
                                            <div className="z-10 bg-white/50 dark:bg-black/20 p-2 rounded-lg text-center backdrop-blur-sm">
                                                <span className={`text-[14px] font-black tracking-tight ${isPermit ? 'text-amber-700' : 'text-blue-600 dark:text-blue-400'}`}>
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
                <EnterpriseCard className="h-full flex flex-col">
                    <EnterpriseSectionHeader title="Profil & Güvenlik Ayarları" icon="⚙️" />
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-6 mb-8 border-b pb-8 border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white relative shadow-lg">
                                {user?.name?.[0]?.toUpperCase() || 'P'}
                            </div>
                            <div>
                                <h4 className="text-2xl font-black">{user?.name}</h4>
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[11px] font-bold uppercase rounded-md">{user?.role || 'Personel'}</span>
                                <div className="mt-1 text-xs font-bold uppercase text-slate-400">ŞİRKET ID NO: #{user?.id?.slice(0,6).toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <EnterpriseInput label="Tam Ad Soyad" defaultValue={user?.name} disabled />
                            <EnterpriseInput label="E-Posta Adresi" type="email" defaultValue={user?.email} disabled />
                            <EnterpriseInput label="Telefon Numarası" type="tel" placeholder="Ulaşım bilgisi sisteme kapalı" disabled />
                        </div>
                        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-[12px] font-bold text-slate-600 uppercase flex items-center gap-2 mb-6"><span>🔒</span> Parola Güncelle</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <EnterpriseInput label="Mevcut Şifre" type="password" />
                                <EnterpriseInput label="Yeni Şifre" type="password" />
                            </div>
                            <div className="mt-8 flex justify-end">
                                <EnterpriseButton variant="primary" className="px-10">BİLGİLERİ GÜNCELLE</EnterpriseButton>
                            </div>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────
export default function PersonelPanel() {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'targets' | 'tasks' | 'leave' | 'payroll' | 'shifts' | 'profile'>('dashboard');
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
        <div style={{ background: 'var(--bg-main)' }} className="min-h-screen text-slate-900 dark:text-white pb-24 no-print relative">
            <div style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)' }} className="px-8 py-6 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1700px] mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-[22px] font-black tracking-tight flex items-center gap-3">
                            <span className="text-3xl drop-shadow-sm">👨‍💼</span> PERSONEL PORTALI
                        </h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Gelişmiş İnsan Kaynakları & Operasyon Yönetim Paneli</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto p-8 space-y-8 duration-700">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                        {[
                            { group: 'GENEL', items: [{ id: 'dashboard', label: 'Özet / PDKS' }] },
                            { group: 'OPERASYON', items: [{ id: 'tasks', label: 'Görevler' }, { id: 'targets', label: 'Hedefler' }] },
                            { group: 'ZAMAN', items: [{ id: 'shifts', label: 'Vardiya' }, { id: 'leave', label: 'İzinler' }] },
                            { group: 'FİNANS', items: [{ id: 'payroll', label: 'Bordro' }] },
                            { group: 'HESAP', items: [{ id: 'profile', label: 'Profil' }] },
                        ].map((grp, i) => (
                            <div key={grp.group} className="flex items-center gap-3">
                                {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                                <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                    {grp.items.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={activeTab === tab.id
                                                ? "px-4 py-2 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px]"
                                                : "px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"
                                            }
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {activeTab === 'dashboard' && <DashboardView handleQrCheckin={handleQrCheckin} handleGpsCheckin={handleGpsCheckin} isScannerOpen={isScannerOpen} setIsScannerOpen={setIsScannerOpen} onQrScan={onQrScan} pdksStatus={pdksStatus} handleCheckout={handleCheckout} targets={targets} statsData={statsData} turnover={turnover} shifts={shifts} payrolls={payrolls} tasks={tasks} user={currentUser} />}
                {activeTab === 'targets' && <TargetsView targets={targets} statsData={statsData} user={currentUser} />}
                {activeTab === 'tasks' && <TasksView user={currentUser} tasks={tasks} fetchTasks={fetchCoreData} loading={loading} />}
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
