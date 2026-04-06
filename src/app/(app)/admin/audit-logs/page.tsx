"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ShieldAlert, Activity, Calendar, RefreshCw, Search, Clock, Fingerprint, Database, User, Server, Eye, AlertCircle } from 'lucide-react';
import { EnterprisePageShell } from "@/components/ui/enterprise";

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

    const getActionBadge = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('create') || a.includes('add')) 
            return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-500/30';
        if (a.includes('delete') || a.includes('remove')) 
            return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/40 dark:border-rose-500/30';
        if (a.includes('update') || a.includes('edit')) 
            return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-indigo-900/40 dark:border-indigo-500/30';
        if (a.includes('login') || a.includes('auth')) 
            return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/40 dark:border-amber-500/30';
        return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
    };

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-indigo-500" />
                            Denetim Kayıtları (Audit Logs)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Platform genelindeki tüm veri mutasyonlarını, oturum açma eylemlerini ve hassas işlemleri izleyin.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchLogs()}
                        disabled={isLoading}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Tabloyu Yenile"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-[#1e293b] p-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
                    <div className="relative">
                        <Database className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                            value={entity}
                            onChange={(e) => setEntity(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer shadow-inner"
                        >
                            <option value="">Hedef Varlık (Hedepsi)</option>
                            <option value="USER">Kullanıcı İşlemleri</option>
                            <option value="TENANT">Tenant / Müşteri</option>
                            <option value="PRODUCT">Ürün / Envanter</option>
                            <option value="INVOICE">Fatura / Finans</option>
                            <option value="SETTING">Sistem Ayarları</option>
                            <option value="FINANCIAL">Finansal Kayıt</option>
                            <option value="TRADE">Ticaret Ağı</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Activity className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="İşlem Kodu (örn: LOGIN, UPDATE)"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-900 dark:text-white dark:placeholder-slate-500 transition-all shadow-inner font-bold uppercase"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center shadow-inner"
                            title="Başlangıç Tarihi"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center shadow-inner"
                            title="Bitiş Tarihi"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 rounded-xl flex gap-3 items-center">
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="text-rose-800 dark:text-rose-300 font-medium text-sm">{error}</span>
                    </div>
                )}

                {/* Logs Table */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-sm min-w-[1100px]">
                            <thead className="bg-slate-50/80 dark:bg-[#111827]/50 border-b border-slate-200 dark:border-white/5 text-[11px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 w-[160px]">Zaman İşareti (TS)</th>
                                    <th className="px-6 py-4">İşlem / Action</th>
                                    <th className="px-6 py-4">Sistem Varlığı</th>
                                    <th className="px-6 py-4 min-w-[250px]">Kripto İşlem Detayı</th>
                                    <th className="px-6 py-4">Aktör (User / System)</th>
                                    <th className="px-6 py-4">Ağ Kimliği (IP/Env)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {isLoading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-32 text-center">
                                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">LOG MİMARİSİ TARANIYOR...</span>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-32 text-center text-slate-400 dark:text-slate-500">
                                            <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                            <p className="font-bold text-lg text-slate-900 dark:text-white mb-2">Denetim Kaydı Bulunamadı</p>
                                            <span className="text-sm">Seçili filtrelere uygun bir mutasyon kaydı veya sistem olayı (Event) yok.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    logs?.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                <div className="flex items-start gap-3">
                                                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <div className="text-slate-900 dark:text-white font-bold text-xs">
                                                            {format(new Date(log.createdAt), 'dd MMM yyyy', { locale: tr })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                                                            {format(new Date(log.createdAt), 'HH:mm:ss.SSS')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${getActionBadge(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-max shadow-sm">
                                                    <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                    {log.entity}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 w-max group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" title={`ID: ${log.entityId}`}>
                                                    <Fingerprint className="inline w-3 h-3 mr-1" />
                                                    {log.entityId.substring(0, 12)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="text-slate-600 dark:text-slate-300 text-xs italic bg-slate-50 dark:bg-[#0f172a] p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-2 shadow-inner font-mono overflow-hidden">
                                                    {log.details || 'Yük datası (Payload) kaydedilmedi.'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-start gap-2">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                                        <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-900 dark:text-white font-bold text-xs">
                                                            {log.userName || log.userEmail || 'System Process (Auto)'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider mt-0.5" title={log.userId}>
                                                            {log.userId.includes('-') ? log.userId.substring(0,8) + '...' : log.userId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                        {log.ipAddress || '127.0.0.1 (Local)'}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[180px]" title={log.userAgent}>
                                                    {log.userAgent || 'Sistem Aracısı (Internal)'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
