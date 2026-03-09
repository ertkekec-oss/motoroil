import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader } from '@/components/ui/enterprise';
import { Activity, AlertTriangle, CheckCircle, Database, Server, Cpu } from 'lucide-react';

export const metadata = {
    title: 'Platform Doctor - Admin'
};

export default async function PlatformDoctorPage() {
    const session = await getSession();
    if (!session || (session.role?.toUpperCase() !== 'SUPER_ADMIN' && session.role?.toUpperCase() !== 'PLATFORM_ADMIN')) {
        redirect('/');
    }

    const recentEvents = await prisma.platformDiagnosticEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    const errorCount = await prisma.platformDiagnosticEvent.count({
        where: { level: 'ERROR' }
    });

    return (
        <EnterprisePageShell
            title="Platform Doctor"
            description="Sistem sağlığı ve teşhis ekranı. Arkaplan servislerinin ve tenant'ların durumunu analiz eder."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <EnterpriseCard className="p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Server className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase">Core API</h3>
                        <p className="text-xl font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sağlıklı</p>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase">Veritabanı (Prisma)</h3>
                        <p className="text-xl font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Bağlı</p>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="p-6 flex items-center gap-4 border-l-4 border-l-orange-500">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase">Son Hatalar</h3>
                        <p className="text-xl font-bold">{errorCount} Log</p>
                    </div>
                </EnterpriseCard>
            </div>

            <EnterpriseSectionHeader title="Sistem Teşhis Kayıtları (Diagnostic Events)" subtitle="Sistem tarafından otomatik kaydedilen kritik uyarı ve olaylar." />

            <EnterpriseCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="px-6 py-4">Seviye</th>
                                <th className="px-6 py-4">Tenant / Şirket</th>
                                <th className="px-6 py-4">Modül</th>
                                <th className="px-6 py-4">Mesaj</th>
                                <th className="px-6 py-4 text-right">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Hiçbir teşhis kaydı bulunamadı.
                                    </td>
                                </tr>
                            ) : recentEvents.map(event => (
                                <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded ${event.level === 'ERROR' || event.level === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                                event.level === 'WARN' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {event.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-xs font-mono">{event.tenantId}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-xs font-bold text-slate-700">{event.module}</div>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-md truncate">
                                        {event.message}
                                    </td>
                                    <td className="px-6 py-3 text-right text-xs font-mono text-slate-500">
                                        {event.createdAt.toLocaleString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
