import { ShieldAlert, Database, ServerCrash, Activity, CheckCircle, Package } from 'lucide-react';
import { getSystemHealth } from '@/actions/healthActions';

export default async function AdminHealthDashboard() {
    const healthData = await getSystemHealth();
    const isHealthy = healthData.ok;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Command Center</h1>
                    <p className="text-sm font-mono text-gray-500 mt-1">Sistem MR Raporu & Ledger Drift Guard</p>
                </div>
                <span className={`px-4 py-1.5 text-xs font-bold rounded-full border shadow-sm flex items-center gap-2
            ${isHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'}`}>
                    {isHealthy ? <CheckCircle className="w-4 h-4" /> : <ServerCrash className="w-4 h-4" />}
                    {isHealthy ? 'SYSTEM OPERATIONAL' : 'SYSTEM DEGRADED'}
                </span>
            </div>

            {healthData.warnings && healthData.warnings.length > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm">
                    <h3 className="text-amber-800 font-semibold text-sm flex items-center mb-2">
                        <ShieldAlert className="w-4 h-4 mr-2" /> Active Alerts & Drift Warnings
                    </h3>
                    <ul className="list-disc leading-relaxed text-sm pl-5 text-amber-700 font-medium">
                        {healthData.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Component 1: Engine/DB */}
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-3">Database Engine</p>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${healthData.components?.db?.status === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">{healthData.components?.db?.status === 'up' ? 'Connected' : 'Offline'}</p>
                            <p className="text-xs text-gray-500 font-mono">Neon Serverless Pool</p>
                        </div>
                    </div>
                </div>

                {/* Component 2: Redis / BullMQ */}
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-3">Rate Limit & Queue</p>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${healthData.components?.redis?.status === 'up' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">{healthData.components?.queue?.counts?.wait || 0} Waiting</p>
                            <p className="text-xs text-gray-500 font-mono">{healthData.components?.redis?.status === 'up' ? 'Upstash Redis Bound' : 'Socket Error'}</p>
                        </div>
                    </div>
                </div>

                {/* Component 3: Schema Drift */}
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-3">Schema Drift Guard</p>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${healthData.components?.migrations?.status === 'synced' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-gray-900 line-clamp-1 truncate w-40" title={healthData.components?.migrations?.latest}>
                                {healthData.components?.migrations?.latest || 'Shadow DB / Unsynced'}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">Prisma State</p>
                        </div>
                    </div>
                </div>

                {/* Component 4: Escrow Activity Pulse */}
                <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-3">Escrow Pulse (15m)</p>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${healthData.components?.activity?.recentPayoutReleased ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-gray-900">
                                {healthData.components?.activity?.recentPayoutReleased ? 'Flowing' : 'No Recent Payouts'}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">Ledger Mutabakat Akışı</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Raw JSON Debug Box for deep ops */}
            <div className="mt-8 bg-gray-900 p-4 rounded-xl shadow-inner border border-gray-800">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 border-b border-gray-800 pb-2">RAW INSPECTOR</p>
                <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                    {JSON.stringify(healthData, null, 2)}
                </pre>
            </div>
        </div>
    );
}
