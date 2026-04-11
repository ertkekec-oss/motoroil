"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar, MapPin, User, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function GlobalReportHeader({ title, description }: { title: string, description: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Init state from URL
    const [dateRange, setDateRange] = useState(searchParams.get('range') || 'this_month');
    const [customStart, setCustomStart] = useState(searchParams.get('start') || '');
    const [customEnd, setCustomEnd] = useState(searchParams.get('end') || '');
    const [branchId, setBranchId] = useState(searchParams.get('branch') || 'all');
    const [personnelId, setPersonnelId] = useState(searchParams.get('staff') || 'all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const applyFilters = () => {
        setIsRefreshing(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('range', dateRange);
        if (dateRange === 'custom') {
            params.set('start', customStart);
            params.set('end', customEnd);
        } else {
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
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-3xl p-5 mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            
            {/* Title & Context */}
            <div className="flex flex-col">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    {title}
                </h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {description}
                </p>
            </div>

            {/* Universal Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto bg-slate-50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-100 dark:border-white/5">
                
                {/* Date Dropdown */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm min-w-[160px]">
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
                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none" />
                        <span className="text-slate-400 font-bold">-</span>
                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none" />
                    </div>
                )}

                {/* Branch Selection */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm min-w-[160px]">
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
                <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm min-w-[160px]">
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
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md px-4 py-2 transition-all group disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
}
