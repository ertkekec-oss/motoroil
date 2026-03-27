import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseTable, EnterpriseEmptyState } from '@/components/ui/enterprise';

export const metadata = {
    title: 'Platform Doctor - Periodya'
};

export default async function PlatformDoctorDashboardPage() {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');
    const isPlatformAdmin = session.user?.tenantId === 'PLATFORM_ADMIN';
    if (!['SUPER_ADMIN'].includes(session.user?.role || '') || !isPlatformAdmin) redirect('/');

    // Parallel fetch
    const [
        checks,
        incidents,
        runbooks
    ] = await Promise.all([
        prisma.platformHealthCheck.findMany({ orderBy: { lastChecked: 'desc' }, take: 20 }),
        prisma.platformIncident.findMany({ where: { status: { in: ['OPEN', 'INVESTIGATING', 'IN_REMEDIATION'] } }, include: { runbook: true } }),
        prisma.platformRunbook.findMany({ include: { _count: { select: { actions: true } } } })
    ]);

    const globalStatus = incidents.length === 0 ? 'OK' : incidents.some(i => i.severity === 'CRITICAL') ? 'CRITICAL' : 'WARNING';
    const failedChecksCount = checks.filter(c => c.status === 'ERROR').length;

    return (
        <EnterprisePageShell
            title="Platform Doctor™ Komuta Merkezi"
            description="Otonom Sağlık Taraması, Arıza Onarımı ve Auto-Healing Sistemleri Analizi."
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
            actions={
                <form action="/api/admin/platform-doctor/actions?action=runChecks" method="POST">
                    <button type="submit" className="px-5 py-2 inline-flex items-center justify-center rounded-xl text-[11px] uppercase tracking-widest font-black border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity shadow-sm">
                        Manuel Tarama Başlat
                    </button>
                </form>
            }
        >
            {/* Summary KPI Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in duration-300">
                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                    <h2 className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest text-center">Global Sistem Durumu</h2>
                    <div className="mt-4 flex items-center justify-center gap-3">
                        <span className="relative flex h-5 w-5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${globalStatus === 'OK' ? 'bg-emerald-400' : globalStatus === 'CRITICAL' ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-5 w-5 ${globalStatus === 'OK' ? 'bg-emerald-500' : globalStatus === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className={`text-2xl font-black tracking-wider uppercase ${globalStatus === 'OK' ? 'text-emerald-600 dark:text-emerald-400' : globalStatus === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>{globalStatus}</span>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                    <h2 className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest text-center">Aktif Olaylar (Incidents)</h2>
                    <p className={`text-4xl font-black mt-2 font-mono ${incidents.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>{incidents.length}</p>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                    <h2 className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest text-center">Başarısız Servisler</h2>
                    <p className={`text-4xl font-black mt-2 font-mono ${failedChecksCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>{failedChecksCount}</p>
                </EnterpriseCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Incidents */}
                <EnterpriseCard className="lg:col-span-2 border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] p-0 overflow-hidden shadow-sm">
                    <div className="p-6">
                        <EnterpriseSectionHeader title="Aktif Tesis Edilen Arızalar (Active Incidents)" subtitle="Sistem tarafından yakalanmış veya otonom onarımı süren anomali raporları." />
                    </div>

                    {incidents.length === 0 ? (
                        <div className="p-12 text-center border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20">
                            <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl mb-4 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                                🛡️
                            </div>
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Aktif Sistem Arızası Bulunmuyor</h3>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tüm platform servisleri ve third-party API tünelleri normal çalışmakta.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-white/5">
                                        <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Olay Tipi</th>
                                        <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Ciddiyet</th>
                                        <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Durum</th>
                                        <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">İlişkili Runbook</th>
                                        <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-right">Aksiyonlar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {incidents.map(i => (
                                        <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{i.type}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${i.severity === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' : i.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'}`}>
                                                    {i.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest rounded-lg">
                                                    {i.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                {i.runbook?.name || '- Yok -'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <form action={`/api/admin/platform-doctor/actions?action=resolveIncident`} method="POST">
                                                    <input type="hidden" name="incidentId" value={i.id} />
                                                    <button type="submit" className="inline-flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                        Yapay Olarak Çöz
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </EnterpriseCard>

                {/* Automation Runbooks */}
                <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm flex flex-col">
                    <div className="mb-6">
                        <EnterpriseSectionHeader title="Healing Runbooks" subtitle="Hata anında otonom çalışacak algoritma listesi." />
                    </div>

                    <div className="space-y-4 flex-1">
                        {runbooks.map(rb => (
                            <div key={rb.id} className="p-5 border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-tight">{rb.name}</h4>
                                    <span className={`w-2.5 h-2.5 rounded-full shadow-sm border border-white/20 ${rb.isActive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed uppercase tracking-wider">{rb.description}</p>
                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 inline-flex items-center px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-500/20">
                                    <span className="mr-1.5 font-mono">{rb._count.actions}</span> Otomasyon Aksiyonu
                                </div>
                            </div>
                        ))}
                        {runbooks.length === 0 && (
                            <div className="text-center py-8 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Tanımlı runbook bulunmamaktadır.
                            </div>
                        )}
                    </div>
                </EnterpriseCard>

                {/* Target Sensor Checks */}
                <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-0 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6">
                        <EnterpriseSectionHeader title="Entegrasyon Sensörleri" subtitle="Bağımlı sistemlerin ping ve health cevapları." />
                    </div>
                    
                    <div className="overflow-x-auto flex-1 border-t border-slate-100 dark:border-white/5">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Servis Modülü</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Son Durum</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-right">Sinyal Alınma</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {checks.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">{c.service}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${c.status === 'OK' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : c.status === 'WARNING' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono text-right">
                                            {c.lastChecked.toLocaleString('tr-TR')}
                                        </td>
                                    </tr>
                                ))}
                                {checks.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            Henüz sağlık taraması yapılmamış.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </EnterpriseCard>

            </div>
        </EnterprisePageShell>
    ); //
}
