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
            description="Autonomous Health Checks, Incident Remediation ve Auto-Healing Sistemleri."
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <form action="/api/admin/platform-doctor/actions?action=runChecks" method="POST">
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-sm font-semibold hover:opacity-90">
                        Manuel Sağlık Taraması Başlat
                    </button>
                </form>
            }
        >
            {/* Summary KPI Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-slate-800">
                    <h2 className="text-[11px] text-slate-400 uppercase font-bold tracking-widest text-center">Global Health Status</h2>
                    <div className="mt-3 flex items-center justify-center gap-2">
                        <span className="relative flex h-4 w-4">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${globalStatus === 'OK' ? 'bg-green-400' : globalStatus === 'CRITICAL' ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-4 w-4 ${globalStatus === 'OK' ? 'bg-green-500' : globalStatus === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{globalStatus}</span>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-slate-800">
                    <h2 className="text-[11px] text-slate-400 uppercase font-bold tracking-widest text-center">Active Incidents</h2>
                    <p className={`text-3xl font-black mt-2 ${incidents.length > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>{incidents.length}</p>
                </EnterpriseCard>
                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-slate-800">
                    <h2 className="text-[11px] text-slate-400 uppercase font-bold tracking-widest text-center">Failed Service Services</h2>
                    <p className={`text-3xl font-black mt-2 ${failedChecksCount > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-slate-100'}`}>{failedChecksCount}</p>
                </EnterpriseCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Incidents */}
                <EnterpriseCard className="lg:col-span-2">
                    <EnterpriseSectionHeader title="Aktif Tesis Edilen Arızalar (Active Incidents)" subtitle="Sistem tarafından yakalanmış veya otonom onarımı süren anomali raporları." />

                    {incidents.length === 0 ? (
                        <EnterpriseEmptyState
                            title="Aktif Sistem Arızası Bulunmuyor"
                            description="Tüm platform servisleri ve third-party API tünelleri normal çalışmakta."
                            icon="🛡️"
                        />
                    ) : (
                        <EnterpriseTable headers={['Olay Tipi', 'Ciddiyet', 'Durum', 'İlişkili Runbook', 'Aksiyonlar']}>
                            {incidents.map(i => (
                                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{i.type}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${i.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : i.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {i.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider rounded">
                                            {i.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                                        {i.runbook?.name || '- Yok -'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <form action={`/api/admin/platform-doctor/actions?action=resolveIncident`} method="POST">
                                            <input type="hidden" name="incidentId" value={i.id} />
                                            <button type="submit" className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded hover:bg-green-100 transition-colors">Yapay Olarak Çöz</button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </EnterpriseTable>
                    )}
                </EnterpriseCard>

                {/* Automation Runbooks */}
                <EnterpriseCard>
                    <div className="flex justify-between items-center mb-6">
                        <EnterpriseSectionHeader title="Healing Runbooks" subtitle="Hata anında otonom çalışacak algoritma listesi." />
                    </div>

                    <div className="space-y-3">
                        {runbooks.map(rb => (
                            <div key={rb.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{rb.name}</h4>
                                    <span className={`w-2 h-2 rounded-full ${rb.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                </div>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{rb.description}</p>
                                <div className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50/50 inline-block px-2 py-0.5 rounded tracking-widest border border-blue-100">
                                    {rb._count.actions} Automation Actions
                                </div>
                            </div>
                        ))}
                    </div>
                </EnterpriseCard>

                {/* Target Sensor Checks */}
                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Entegrasyon Sensörleri" subtitle="Bağımlı sistemlerin ping ve health cevapları." />
                    <EnterpriseTable headers={['Servis Modülü', 'Son Durum', 'Sinyal Alinma']}>
                        {checks.map(c => (
                            <tr key={c.id}>
                                <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{c.service}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${c.status === 'OK' ? 'bg-green-100 text-green-700' : c.status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[10px] text-slate-400 font-mono">
                                    {c.lastChecked.toLocaleString('tr-TR')}
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                </EnterpriseCard>

            </div>
        </EnterprisePageShell>
    ); //
}
