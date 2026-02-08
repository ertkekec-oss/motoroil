"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    details: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    tenantId: string;
}

export default function AuditLogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [entity, setEntity] = useState('');
    const [action, setAction] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (entity) params.append('entity', entity);
            if (action) params.append('action', action);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setLogs(data.logs);
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            setError('Giriş çıkış kayıtları yüklenirken hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [entity, action, startDate, endDate]);

    const getActionColor = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('create') || a.includes('add')) return 'text-emerald-400 bg-emerald-400/10';
        if (a.includes('delete') || a.includes('remove')) return 'text-rose-400 bg-rose-400/10';
        if (a.includes('update') || a.includes('edit')) return 'text-blue-400 bg-blue-400/10';
        if (a.includes('login') || a.includes('auth')) return 'text-amber-400 bg-amber-400/10';
        return 'text-slate-400 bg-slate-400/10';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Denetim Kayıtları (Audit Logs)</h1>
                    <p className="text-slate-500 text-sm">Sistem genelindeki tüm hassas işlemlerin ve değişikliklerin izi.</p>
                </div>
                <button
                    onClick={() => fetchLogs()}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                    {isLoading ? '🔄 Yenileniyor...' : '🔄 Listeyi Güncelle'}
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase pl-1">Varlık (Entity)</label>
                    <select
                        value={entity}
                        onChange={(e) => setEntity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500/50 transition-all"
                    >
                        <option value="">Tümü</option>
                        <option value="USER">Kullanıcı</option>
                        <option value="TENANT">Tenant</option>
                        <option value="PRODUCT">Ürün</option>
                        <option value="INVOICE">Fatura</option>
                        <option value="SETTING">Ayar</option>
                        <option value="FINANCIAL">Finansal</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase pl-1">İşlem (Action)</label>
                    <input
                        type="text"
                        placeholder="Örn: CREATE, UPDATE..."
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase pl-1">Başlangıç</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase pl-1">Bitiş</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Zaman</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">İşlem</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Varlık</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Detay</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Kullanıcı</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">IP Adresi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading && logs.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-8">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                        Hiç kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group text-sm">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="text-slate-900 font-medium">
                                                {format(new Date(log.createdAt), 'dd MMM yyyy', { locale: tr })}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {format(new Date(log.createdAt), 'HH:mm:ss')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-900 font-mono font-bold tracking-tight">{log.entity}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">ID: {log.entityId}</div>
                                        </td>
                                        <td className="p-4 min-w-[300px]">
                                            <div className="text-slate-600 line-clamp-2 italic">
                                                {log.details || 'Detay belirtilmemiş'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-900 font-medium">{log.userName || log.userEmail || 'Sistem'}</div>
                                            <div className="text-[10px] text-slate-500">{log.userId}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-[11px] text-slate-700 font-mono">{log.ipAddress || '—'}</div>
                                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{log.userAgent}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}

function getActionColor(action: string) {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('add')) return 'text-emerald-700 bg-emerald-50';
    if (a.includes('delete') || a.includes('remove')) return 'text-rose-700 bg-rose-50';
    if (a.includes('update') || a.includes('edit')) return 'text-blue-700 bg-blue-50';
    if (a.includes('login') || a.includes('auth')) return 'text-amber-700 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
}
