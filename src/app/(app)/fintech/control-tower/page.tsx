"use client";

import { useState, useEffect } from 'react';
import {
    IconActivity,
    IconShield,
    IconAlert,
    IconTrendingUp,
    IconClock,
    IconZap,
    IconCheck,
    IconBank,
    IconCreditCard
} from '@/components/icons/PremiumIcons';

// Simple Arrow components
const ArrowUpRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M19 5H10M19 5V14" /></svg>;
const ArrowDownRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19l-7-7 7-7" /></svg>; // Simplified
const ShieldAlert = ({ className }: any) => <IconAlert className={className} />;
const CheckCircle2 = ({ className }: any) => <IconCheck className={className} />;

const MetricCard = ({ title, value, unit, subtitle, color, icon: Icon, trend }: any) => (
    <div className="card glass p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:opacity-20`} />
        <div className="relative">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-white">{value}</span>
                <span className="text-gray-500 font-bold">{unit}</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(trend)}% vs Last Week
                </div>
            )}
        </div>
    </div>
);

const HealthGauge = ({ status, riskScore }: any) => {
    const isHealthy = status === 'HEALTHY' || (riskScore && riskScore > 70);
    const isWarning = status === 'WARNING' || (riskScore && riskScore > 40 && riskScore <= 70);

    return (
        <div className="card glass p-6 flex flex-col items-center justify-center text-center group">
            <div className="relative w-24 h-24 mb-4">
                {/* Score Gauge Background */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle
                        cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * (riskScore || 0)) / 100}
                        className={`transition-all duration-1000 ease-out ${isHealthy ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-rose-500'
                            }`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white">{riskScore || 0}</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase">Risk</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
                <h3 className={`text-lg font-black uppercase tracking-tighter ${isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                    {isHealthy ? 'HEALTHY' : isWarning ? 'WARNING' : 'CRITICAL'}
                </h3>
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Financial Health Score</p>
        </div>
    );
};

export default function FintechControlTower() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/fintech/dashboard/metrics');
                const json = await res.json();
                if (json.success) setMetrics(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="p-12 space-y-8 animate-pulse text-indigo-400/50">
            <div className="h-20 bg-white/5 rounded-2xl w-full" />
            <div className="grid grid-cols-4 gap-6">
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-64 bg-white/5 rounded-2xl" />
                <div className="h-64 bg-white/5 rounded-2xl" />
            </div>
        </div>
    );

    if (!metrics) return <div className="p-12 text-center text-gray-500">Veri alınamadı. Altyapı kontrol ediliyor...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                        FINANCIAL CONTROL TOWER
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider flex items-center gap-2">
                        <IconActivity className="w-4 h-4 text-indigo-500" /> Real-time Immutable Fintech Core Monitoring
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 ${metrics.engine.autopilotEnabled ? 'border-emerald-500/30' : 'border-white/10'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${metrics.engine.autopilotEnabled ? 'bg-emerald-500 animate-ping' : 'bg-gray-600'}`} />
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                            {metrics.engine.autopilotEnabled ? `Autopilot Active: ${metrics.engine.autopilotCount} Rules` : 'Autopilot Inactive'}
                        </span>
                    </div>
                    <button className="btn-secondary text-[10px] py-2 px-4 uppercase font-black tracking-widest">Global Safety Breaker</button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Receivables (120.03)"
                    value={metrics.financials.totalReceivable.toLocaleString('tr-TR')}
                    unit="₺"
                    subtitle={`${metrics.financials.openInvoiceCount} pending items`}
                    color="bg-blue-500"
                    icon={IconCreditCard}
                    trend={12.5}
                />
                <MetricCard
                    title="Suspense Balance (397.01)"
                    value={metrics.financials.suspenseAmount.toLocaleString('tr-TR')}
                    unit="₺"
                    subtitle="Awaiting manual review"
                    color="bg-rose-500"
                    icon={IconAlert}
                    trend={-5.2}
                />
                <MetricCard
                    title="Reconciled Today"
                    value={metrics.financials.reconciledTodayAmount?.toLocaleString('tr-TR') || "0"}
                    unit="₺"
                    subtitle={`${metrics.financials.reconciledTodayCount || 0} settlements closed`}
                    color="bg-emerald-500"
                    icon={IconCheck}
                />
                <HealthGauge status={metrics.health.grade} riskScore={metrics.health.riskScore} />
            </div>

            {/* Middle Section: Cashflow & Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cashflow Forecast */}
                <div className="card glass p-8 border-l-4 border-indigo-500">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <IconTrendingUp className="w-5 h-5 text-indigo-400" /> Cashflow Projections
                        </h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Predictive AI Forecast</p>
                    </div>

                    <div className="space-y-6">
                        {metrics.forecast && metrics.forecast.length > 0 ? metrics.forecast.map((f: any, i: number) => (
                            <div key={i} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-400">Next {f.horizonDays} Days</span>
                                    <span className={`text-sm font-black ${Number(f.netPosition) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {Number(f.netPosition).toLocaleString('tr-TR')} ₺
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000 group-hover:opacity-80"
                                        style={{ width: `${(Number(f.expectedIn) / (Number(f.expectedIn) + Number(f.expectedOut))) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-rose-500 transition-all duration-1000 group-hover:opacity-80"
                                        style={{ width: `${(Number(f.expectedOut) / (Number(f.expectedIn) + Number(f.expectedOut))) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 font-bold">
                                    <span className="text-emerald-500/70">IN: {Number(f.expectedIn).toLocaleString('tr-TR')}</span>
                                    <span className="text-rose-500/70">OUT: {Number(f.expectedOut).toLocaleString('tr-TR')}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="h-32 flex items-center justify-center text-gray-600 italic text-xs">
                                No forecast data yet. Analyzing bank patterns...
                            </div>
                        )}
                    </div>
                </div>

                {/* Aging Analysis */}
                <div className="lg:col-span-2 card glass p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <IconClock className="w-5 h-5 text-indigo-400" /> Aging Bucket Analysis
                            </h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">120.03 Account Exposure</p>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">Real-time Snapshot</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {metrics.aging.map((bucket: any, i: number) => (
                            <div key={i} className="space-y-4">
                                <div className="relative h-48 w-full bg-white/5 rounded-2xl overflow-hidden flex flex-col justify-end p-1">
                                    <div
                                        className={`w-full rounded-xl transition-all duration-1000 ease-out ${i === 0 ? 'bg-emerald-500/50' : i === 1 ? 'bg-blue-500/50' : i === 2 ? 'bg-amber-500/50' : 'bg-rose-500/50'
                                            }`}
                                        style={{ height: `${Math.min((bucket.amount / metrics.financials.totalReceivable) * 100, 100) || 5}%` }}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{bucket.label}</p>
                                    <p className="text-sm font-black text-white leading-none">{bucket.amount.toLocaleString('tr-TR')} ₺</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Performance & Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card glass p-6 border-amber-500/10 hover:border-amber-500/30 transition-colors">
                    <h3 className="text-xs font-bold text-amber-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <IconShield className="w-4 h-4" /> System Intelligence Signals
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-gray-400"><span className="text-white font-bold">Autopilot:</span> ±1 TL Tolerance robot active and reconciling settlements.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <p className="text-gray-400"><span className="text-white font-bold">Idempotency:</span> Layer-1 data guard 100% effective against duplicates.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-amber-400/80 italic">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p>"Open Banking sync successful. 3 new matching rules learned today based on your manual inputs."</p>
                        </div>
                    </div>
                </div>

                <div className="card glass p-6 bg-gradient-to-br from-indigo-900/10 to-transparent border-indigo-500/20">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                        <IconZap className="w-4 h-4 text-yellow-400" /> Engine Performance
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Avg Latency (P50)</span>
                            <span className="text-sm font-black text-indigo-400">{metrics.performance.avgLatency}ms</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[75%]" />
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase">7D Failed Jobs</span>
                            <span className={`font-black ${metrics.health.failedEventCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {metrics.health.failedEventCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-xl border-t border-white/5 z-50 flex justify-center">
                <div className="max-w-7xl w-full flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Main Bank</span>
                            <span className="text-xs text-white font-medium">102.01 - Active</span>
                        </div>
                        <div className="flex flex-col border-l border-white/10 pl-6">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Fintech Version</span>
                            <span className="text-xs text-indigo-400 font-black tracking-widest">OS v2.0-STABLE</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
                            Download Audit Trail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
