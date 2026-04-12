import React, { useState } from 'react';
import { RefreshCw, Calendar, MapPin, User } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function GlobalReportHeader({ 
    title, 
    description,
}: {
    title: string;
    description: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // States matching URL params
    const [dateRange, setDateRange] = useState(searchParams.get('period') || 'this_month');
    const [branchId, setBranchId] = useState(searchParams.get('branch') || 'all');
    const [personnelId, setPersonnelId] = useState(searchParams.get('staff') || 'all');
    
    // Custom Date Range
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const applyFilters = () => {
        setIsRefreshing(true);
        const params = new URLSearchParams(searchParams.toString());
        
        if (dateRange === 'custom') {
            params.set('start', customStart);
            params.set('end', customEnd);
            params.set('period', 'custom');
        } else {
            params.set('period', dateRange);
            params.delete('start');
            params.delete('end');
        }
        
        if (branchId !== 'all') params.set('branch', branchId);
        else params.delete('branch');

        if (personnelId !== 'all') params.set('staff', personnelId);
        else params.delete('staff');

        router.push(`${pathname}?${params.toString()}`);
        
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <div className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            
            {/* Title & Context */}
            <div className="flex flex-col">
                <h1 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    {title}
                </h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {description}
                </p>
            </div>

            {/* Universal Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                
                {/* Date Dropdown */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 h-[36px] rounded-[8px] border border-slate-200 dark:border-white/5 shadow-sm min-w-[160px]">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none w-full cursor-pointer appearance-none"
                    >
                        <option value="today">Bugün</option>
                        <option value="this_week">Bu Hafta</option>
                        <option value="this_month">Bu Ay</option>
                        <option value="q1">1. Çeyrek (Q1)</option>
                        <option value="q2">2. Çeyrek (Q2)</option>
                        <option value="q3">3. Çeyrek (Q3)</option>
                        <option value="q4">4. Çeyrek (Q4)</option>
                        <option value="ytd">Yılbaşı - Bugün</option>
                        <option value="custom">Özel Tarih Seç</option>
                    </select>
                </div>

                {/* Custom Dates */}
                {dateRange === 'custom' && (
                    <div className="flex items-center gap-2">
                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-white dark:bg-[#0f172a] px-3 h-[36px] rounded-[8px] border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none shadow-sm" />
                        <span className="text-slate-400 font-bold">-</span>
                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-white dark:bg-[#0f172a] px-3 h-[36px] rounded-[8px] border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none shadow-sm" />
                    </div>
                )}

                {/* Branch Selection */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 h-[36px] rounded-[8px] border border-slate-200 dark:border-white/5 shadow-sm min-w-[160px]">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <select 
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none w-full cursor-pointer appearance-none"
                    >
                        <option value="all">Tüm Organizasyon</option>
                        <option value="merkez">Merkez Şube</option>
                        <option value="marmara">Marmara Lojistik</option>
                    </select>
                </div>

                {/* Personnel Selection */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 h-[36px] rounded-[8px] border border-slate-200 dark:border-white/5 shadow-sm min-w-[160px]">
                    <User className="w-4 h-4 text-slate-400" />
                    <select 
                        value={personnelId}
                        onChange={(e) => setPersonnelId(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none w-full cursor-pointer appearance-none"
                    >
                        <option value="all">Tüm Personel</option>
                        <option value="rep1">Ahmet Yılmaz (Saha)</option>
                        <option value="rep2">Ayşe Demir (Merkez)</option>
                    </select>
                </div>

                <button 
                    onClick={applyFilters}
                    disabled={isRefreshing}
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold shadow-sm px-4 h-[36px] transition-all group disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
}
