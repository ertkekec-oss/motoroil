import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, AlertCircle, Activity, Zap, Play, RefreshCw, Server, Globe, Database } from 'lucide-react';

export const metadata = {
    title: 'Platform Doctor - Self Healing Diagnostics',
};

const DIAGNOSTICS_MODULES = [
    { name: 'Gateway (PayTR)', icon: <Server className="w-5 h-5text-blue-500" />, status: 'HEALTHY' },
    { name: 'E-Fatura (Nilvera)', icon: <Globe className="w-5 h-5 text-emerald-500" />, status: 'HEALTHY' },
    { name: 'Sanal Pos (Iyzico)', icon: <Server className="w-5 h-5 text-blue-500" />, status: 'WARNING' },
    { name: 'Kargo (Yurtiçi)', icon: <Globe className="w-5 h-5 text-emerald-500" />, status: 'HEALTHY' },
    { name: 'Sync Engine', icon: <Database className="w-5 h-5 text-emerald-500" />, status: 'HEALTHY' },
    { name: 'Cache Layer', icon: <Activity className="w-5 h-5 text-orange-500" />, status: 'WARNING' },
];

export default async function PlatformDoctorDashboard() {
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN')) {
        redirect('/login');
    }

    const events = await prisma.platformDiagnosticEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30
    });

    const activeIssues = events.filter(e => e.status === 'OPEN').length;
    const resolvedIssues = events.filter(e => e.status === 'AUTO_FIXED' || e.status === 'MANUAL_FIX_REQUIRED').length;

    // Health Score calculation mock
    const healthScore = Math.max(0, 100 - (activeIssues * 8));

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-600" />
                        Platform Doctor
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Sistem sağlığı, otonom hata tespiti ve self-healing runbook yönetim merkezi.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                        <RefreshCw className="w-4 h-4" /> Manuel Tarama Başlat
                    </button>
                </div>
            </div>

            {/* Top Metrics Map */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Sistem Sağlık Skoru</div>
                        <Activity className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-4xl font-black text-slate-900 mb-2">%{healthScore}</div>
                    <div className="flex w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${healthScore > 90 ? 'bg-emerald-500' : healthScore > 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${healthScore}%` }}></div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Aktif Hatalar</div>
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{activeIssues}</div>
                    <div className="text-xs text-slate-500 mt-2">Müdahale bekleyen olaylar</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Otonom Çözülen</div>
                        <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{resolvedIssues}</div>
                    <div className="text-xs text-slate-500 mt-2">Son 24 saat içindeki auto-fix</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Son Tarama</div>
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mb-2 mt-2">2 dk önce</div>
                    <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 inline-block px-2 py-1 rounded">Devamlı Aktif Mod</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Modules Status */}
                <div className="lg:col-span-1 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-500" />
                            İzlenen Sistem Modülleri
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {DIAGNOSTICS_MODULES.map((m, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">{m.icon}</div>
                                    <span className="font-semibold text-sm text-slate-700">{m.name}</span>
                                </div>
                                <div>
                                    {m.status === 'HEALTHY' && <span className="flex h-2.5 w-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                                    {m.status === 'WARNING' && <span className="flex h-2.5 w-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"></span>}
                                    {m.status === 'CRITICAL' && <span className="flex h-2.5 w-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Event Log */}
                <div className="lg:col-span-2 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-slate-500" />
                            Diagnostic Olay Günlüğü
                        </h3>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded border border-red-100">Crtical</span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded border border-blue-100">Auto-Fixed</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {events.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3 opacity-50" />
                                <p className="font-semibold">Sistem tamamen sağlıklı. Hiç olay kaydedilmedi.</p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.level === 'CRITICAL' ? 'bg-red-500' : event.level === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                    <div className="flex justify-between items-start mb-2 pl-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${event.level === 'CRITICAL' ? 'bg-red-50 text-red-600' : event.level === 'WARNING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {event.level}
                                            </span>
                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{event.component}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {new Date(event.createdAt).toLocaleString('tr-TR')}
                                        </div>
                                    </div>
                                    <div className="pl-3 mb-3">
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{event.message}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 text-ellipsis">
                                            Tenant: {event.tenantId} • Detaylar: {event.details ? JSON.stringify(event.details) : 'Yok'}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pl-3 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                                        {event.status === 'AUTO_FIXED' ? (
                                            <div className="flex flex-col items-start gap-1 w-full bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                    <Zap className="w-3.5 h-3.5" /> Self-Healing Başarılı
                                                </div>
                                                <span className="text-[10px] text-slate-500 tracking-wide uppercase font-semibold">Çalıştırılan Runbook: {event.autoFixAction}</span>
                                            </div>
                                        ) : event.status === 'OPEN' ? (
                                            <div className="w-full flex justify-between items-center bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Aksiyon Bekleniyor
                                                    </span>
                                                    {event.autoFixAction && <span className="text-[10px] text-slate-500 mt-0.5">Önerilen Çözüm: {event.autoFixAction}</span>}
                                                </div>
                                                <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded shadow-sm flex items-center gap-1.5 transition-colors">
                                                    <Play className="w-3 h-3 text-emerald-400" /> Runbook'u Başlat
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">İncelendi ({event.status})</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
