import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, AlertCircle, Activity, Zap, Play, RefreshCw, Server, Globe, Database, Terminal } from 'lucide-react';

export const metadata = {
    title: 'Platform Doctor - Self Healing Diagnostics',
};

const DIAGNOSTICS_MODULES = [
    { name: 'Gateway (PayTR)', icon: <Server className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />, status: 'HEALTHY' },
    { name: 'E-Fatura (Nilvera)', icon: <Globe className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, status: 'HEALTHY' },
    { name: 'Sanal Pos (Iyzico)', icon: <Server className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />, status: 'WARNING' },
    { name: 'Kargo (Yurtiçi)', icon: <Globe className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, status: 'HEALTHY' },
    { name: 'Sync Engine', icon: <Database className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, status: 'HEALTHY' },
    { name: 'Cache Layer', icon: <Activity className="w-5 h-5 text-orange-500 dark:text-orange-400" />, status: 'WARNING' },
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
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
                
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
                            Platform Doctor (Sistem Sağlığı)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Ağır sistem sağlığı, otonom hata tespiti ve self-healing runbook yönetim merkezi.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-indigo-500/50">
                            <RefreshCw className="w-4 h-4" /> Manuel Tarama Başlat
                        </button>
                    </div>
                </div>

                {/* Top Metrics Map */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-white/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sistem Sağlık Skoru</div>
                            <Activity className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">%{healthScore}</div>
                            <div className="flex w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-1000 ${healthScore > 90 ? 'bg-emerald-500 dark:bg-emerald-400' : healthScore > 70 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-red-500 dark:bg-red-400'}`} style={{ width: `${healthScore}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aktif Hatalar</div>
                            <AlertTriangle className={`w-5 h-5 ${activeIssues > 0 ? 'text-amber-500 dark:text-amber-400 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`} />
                        </div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{activeIssues}</div>
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">Müdahale Bekleyen</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Otonom Çözülen</div>
                            <Zap className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{resolvedIssues}</div>
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">Son 24 saat auto-fix</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Son Tarama</div>
                            <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div className="relative z-10 flex flex-col justify-end h-full">
                            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">2 dk önce</div>
                            <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-500/30 font-black uppercase tracking-widest px-2.5 py-1 rounded w-max">Devamlı Aktif Mod</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Modules Status */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="border border-slate-200 dark:border-white/5 rounded-2xl bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden flex-1">
                            <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-[#111827]/50">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs tracking-widest uppercase flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    İzlenen Sistem Modülleri
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {DIAGNOSTICS_MODULES.map((m, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 group-hover:border-indigo-500/30 transition-colors shadow-inner">{m.icon}</div>
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{m.name}</span>
                                        </div>
                                        <div>
                                            {m.status === 'HEALTHY' && <span className="flex h-3 w-3 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                                            {m.status === 'WARNING' && <span className="flex h-3 w-3 bg-amber-500 dark:bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"></span>}
                                            {m.status === 'CRITICAL' && <span className="flex h-3 w-3 bg-red-500 dark:bg-red-400 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Event Log Console */}
                    <div className="lg:col-span-2 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-900 dark:bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col h-[600px] relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/50 dark:bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                        <div className="p-4 border-b border-slate-800 dark:border-slate-800/50 bg-slate-950 flex justify-between items-center relative z-10">
                            <h3 className="font-bold text-slate-300 text-xs tracking-widest uppercase flex items-center gap-2 font-mono">
                                <Terminal className="w-4 h-4 text-emerald-500" />
                                diagnostic.log_stream
                            </h3>
                            <div className="flex gap-2">
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider rounded border border-red-500/30">Crtical</span>
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded border border-indigo-500/30">Auto-Fixed</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0f1a] relative z-10 custom-scrollbar">
                            {events.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-600">
                                    <ShieldCheck className="w-16 h-16 text-emerald-500/50 mb-4" />
                                    <p className="font-mono text-sm tracking-widest uppercase">SYSLOG: HEALTHY. NO EVENTS DETECTED.</p>
                                </div>
                            ) : (
                                events.map(event => (
                                    <div key={event.id} className="bg-slate-900 dark:bg-[#111827] border border-slate-800 dark:border-slate-700/80 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-slate-600 transition-colors">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.level === 'CRITICAL' ? 'bg-red-500' : event.level === 'WARNING' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                                        <div className="flex justify-between items-start mb-2 pl-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${event.level === 'CRITICAL' ? 'bg-red-500/20 border-red-500/30 text-red-400' : event.level === 'WARNING' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'}`}>
                                                    {event.level}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400 bg-slate-800 dark:bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded">{event.component}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono tracking-wider">
                                                {new Date(event.createdAt).toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                        <div className="pl-3 mb-3">
                                            <h4 className="font-bold text-slate-200 text-sm mb-1.5 font-mono">{event.message}</h4>
                                            <p className="text-[11px] text-slate-400 line-clamp-2 text-ellipsis font-mono leading-relaxed bg-[#0a0f1a] p-2 rounded border border-slate-800">
                                                <span className="text-slate-500">Tenant:</span> {event.tenantId} • <span className="text-slate-500">Payload:</span> {event.details ? JSON.stringify(event.details) : '{}'}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="pl-3 flex flex-wrap gap-2 pt-3 border-t border-slate-800/50">
                                            {event.status === 'AUTO_FIXED' ? (
                                                <div className="flex flex-col items-start gap-1 w-full bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                                        <Zap className="w-3.5 h-3.5" /> Self-Healing Execution Successful
                                                    </div>
                                                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 tracking-widest uppercase font-black">RUNBOOK ALIAS: {event.autoFixAction}</span>
                                                </div>
                                            ) : event.status === 'OPEN' ? (
                                                <div className="w-full flex justify-between items-center bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <AlertTriangle className="w-3.5 h-3.5" /> MANUAL ACTION REQUIRED
                                                        </span>
                                                        {event.autoFixAction && <span className="text-[10px] text-amber-500/70 font-mono">Suggested Runbook: {event.autoFixAction}</span>}
                                                    </div>
                                                    <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 text-[11px] font-black uppercase tracking-wider rounded shadow-sm flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-amber-500/50">
                                                        <Play className="w-3 h-3 fill-current" /> EXECUTE RUNBOOK
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-500 font-bold bg-slate-800 border border-slate-700 px-2 py-1 rounded uppercase tracking-widest">Marked as ({event.status})</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
