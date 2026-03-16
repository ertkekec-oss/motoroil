import React, { useState, useEffect } from 'react';
import { Staff } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { Search, UserCircle, Target, TrendingUp, CheckCircle2, DollarSign, Calendar, Flame, Plus } from 'lucide-react';

interface StaffTarget {
    id: string;
    staffId: string;
    type: 'TURNOVER' | 'VISIT';
    targetValue: number;
    currentValue: number;
    startDate: string;
    endDate: string;
    period: string;
    commissionRate: number;
    bonusAmount: number;
    status: string;
    staff?: { name: string; id: string };
    estimatedBonus?: number;
}

interface HrTargetsTabProps {
    staff: Staff[];
    targets: StaffTarget[];
    fetchTargets: () => void;
    setShowTargetModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HrTargetsTab({ staff, targets, fetchTargets, setShowTargetModal }: HrTargetsTabProps) {
    const { showError, showSuccess, showConfirm } = useModal();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState<string | number | null>(null);

    // Filter staff list
    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.branch?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Selected staff's targets
    const selectedTargets = targets.filter(t => t.staffId === selectedStaffId);

    // KPIs for selected staff
    const totalTarget = selectedTargets.reduce((sum, t) => sum + Number(t.targetValue), 0);
    const totalActual = selectedTargets.reduce((sum, t) => sum + Number(t.currentValue), 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const totalEstBonus = selectedTargets.reduce((sum, t) => sum + Number(t.estimatedBonus || 0), 0);

    const activeTargetsCount = selectedTargets.filter(t => t.status !== 'İptal' && t.currentValue < t.targetValue).length;
    const completedTargetsCount = selectedTargets.filter(t => t.currentValue >= t.targetValue).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500 h-[calc(100vh-280px)] min-h-[600px]">
            {/* COLUMN 1: Staff Selection List (1 span) */}
            <div className="lg:col-span-1 flex flex-col gap-4 h-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-[#1e293b]/50">
                    <h3 className="text-[13px] font-black tracking-widest text-slate-900 dark:text-white uppercase mb-3 flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-emerald-500" />
                        Akıllı Personel Listesi
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Personel ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 modern-scrollbar">
                    {filteredStaff.map((person) => {
                        const isSelected = selectedStaffId === person.id;
                        // Count active targets for this person
                        const personActiveTargets = targets.filter((t: any) => t.staffId === person.id && (t.currentValue < t.targetValue)).length;

                        return (
                            <button
                                key={person.id}
                                onClick={() => setSelectedStaffId(isSelected ? null : person.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group ${
                                    isSelected
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isSelected ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {person.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{person.name}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{person.role || 'Personel'}</p>
                                    </div>
                                </div>
                                {personActiveTargets > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                        {personActiveTargets} Hedef
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* COLUMNS 2-4: KPIs and Target Details (3 span) */}
            <div className="lg:col-span-3 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0f172a] shadow-sm rounded-[16px] border border-slate-200 dark:border-white/5 p-6 space-y-6 overflow-y-auto modern-scrollbar">
                
                {/* Header & Quick Action */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1e293b]/60 p-5 rounded-[12px] border border-slate-100 dark:border-white/5 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" />
                            {selectedStaffId ? `${staff.find(s => s.id === selectedStaffId)?.name} M. Hedefleri` : 'Genel Hedef Analizi'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Personelin hedef gerçekleştirme ve prim oranlarını canlı takip edin.</p>
                    </div>
                    <button
                        onClick={() => setShowTargetModal(true)}
                        className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold tracking-wide shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        YENİ HEDEF
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    {/* KPI 1 */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] p-5 shadow-sm">
                        <h4 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Performans Başarısı</h4>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {selectedStaffId ? `%${overallProgress}` : '-%'}
                        </div>
                        {selectedStaffId && (
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-[#334155]/50 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
                            </div>
                        )}
                    </div>
                    {/* KPI 2 */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] p-5 shadow-sm">
                        <h4 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Ulaşılan Hedefler</h4>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {selectedStaffId ? completedTargetsCount : '-'}
                        </div>
                    </div>
                    {/* KPI 3 */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] p-5 shadow-sm">
                        <h4 className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-1.5"><Flame className="w-3 h-3 text-orange-500" /> Aktif Hedefler</h4>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            {selectedStaffId ? activeTargetsCount : '-'}
                        </div>
                    </div>
                    {/* KPI 4 */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[16px] p-5 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-[#0f172a]">
                        <h4 className="text-[11px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-3 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Hak Edilen Prim</h4>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {selectedStaffId ? `₺${totalEstBonus.toLocaleString()}` : '-'}
                        </div>
                    </div>
                </div>

                {/* Target List */}
                {selectedStaffId ? (
                <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] shrink-0">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Detaylı Hedef Tablosu</h3>
                    </div>
                    {selectedTargets.length === 0 ? (
                         <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-transparent">
                             <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                             <h3 className="text-[14px] font-bold text-slate-600 dark:text-slate-300 mb-1">Aktif Hedef Bulunamadı</h3>
                             <p className="text-[12px] text-slate-500">Bu personel için tanımlanmış bir performans hedefi yok.</p>
                         </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto modern-scrollbar outline-none">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] sticky top-0 z-10 border-b border-slate-200 dark:border-white/5 shadow-sm">
                                    <tr>
                                        <th className="p-3 pl-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Hedef Türü</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Durum</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Hedeflenen</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">Gerçekleşen</th>
                                        <th className="p-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pr-4 w-48 backdrop-blur bg-slate-50/90 dark:bg-[#1e293b]/90">İlerleme</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-[#0f172a]">
                                    {selectedTargets.map((t) => {
                                        const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                        const isCompleted = progress >= 100;

                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="p-3 pl-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'TURNOVER' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            {t.type === 'TURNOVER' ? <DollarSign className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                                                {t.type === 'TURNOVER' ? 'Ciro Hedefi' : 'Ziyaret Hedefi'}
                                                            </div>
                                                            <div className="text-[10px] uppercase font-bold text-slate-400 truncate mt-0.5">
                                                                {new Date(t.startDate).toLocaleDateString('tr-TR')} - {new Date(t.endDate).toLocaleDateString('tr-TR')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 align-middle text-[12px] whitespace-nowrap">
                                                    {isCompleted ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                                            <CheckCircle2 className="w-3 h-3" /> Başarılı
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                                            <TrendingUp className="w-3 h-3" /> Devam Ediyor
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 align-middle text-[13px] font-bold text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                                                    {t.type === 'TURNOVER' ? `₺${Number(t.targetValue).toLocaleString()}` : `${t.targetValue} Adet`}
                                                </td>
                                                <td className="p-3 align-middle text-[13px] font-black text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                                                    {t.type === 'TURNOVER' ? `₺${Number(t.currentValue).toLocaleString()}` : `${t.currentValue} Adet`}
                                                </td>
                                                <td className="p-3 align-middle pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[11px] font-bold w-9 text-right shrink-0 ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                            %{progress}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-right">
                                                        <span className="text-[10px] font-semibold text-emerald-600">Prim: ₺{Number(t.estimatedBonus || 0).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                ) : (
                    <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center bg-slate-50/30 dark:bg-transparent">
                        <div className="text-center">
                            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <h3 className="text-[15px] font-bold text-slate-600 dark:text-slate-300 mb-1">Personel Seçilmedi</h3>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">Hedefleri görüntülemek için sol menüden bir personel seçiniz.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
