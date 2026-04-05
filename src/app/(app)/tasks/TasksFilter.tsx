"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TasksFilter({ initialStatus, initialPriority, initialType }: any) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex gap-4 items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filtreler:</span>
            
            <select 
                defaultValue={initialStatus || ''} 
                onChange={(e) => handleChange('status', e.target.value)} 
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
            >
                <option value="">Tüm Durumlar</option>
                <option value="OPEN">Açık</option>
                <option value="IN_PROGRESS">Devam Ediyor</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal</option>
            </select>

            <select 
                defaultValue={initialPriority || ''} 
                onChange={(e) => handleChange('priority', e.target.value)} 
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
            >
                <option value="">Tüm Öncelikler</option>
                <option value="CRITICAL">Kritik</option>
                <option value="HIGH">Yüksek</option>
                <option value="MEDIUM">Orta</option>
                <option value="LOW">Düşük</option>
            </select>

            <select 
                defaultValue={initialType || ''} 
                onChange={(e) => handleChange('type', e.target.value)} 
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm"
            >
                <option value="">Tüm Tipler</option>
                {[
                    'RECON_DISPUTE',
                    'SIGNATURE_REVIEW',
                    'SIGNATURE_REJECTED',
                    'MAIL_FAILURE',
                    'OTP_FAILURE',
                    'SYSTEM_ALERT'
                ].map(t => (
                    <option key={t} value={t}>{t}</option>
                ))}
            </select>
            
        </div>
    );
}
