import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseTable } from '@/components/ui/enterprise';

export const metadata = {
    title: 'Support Analytics - Periodya Admin'
};

export default async function AdminSupportAnalyticsPage() {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');
    const role = session.user?.role;
    const isPlatformAdmin = session.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role || '') && !isPlatformAdmin) {
        redirect('/');
    }

    const whereScope: any = isPlatformAdmin ? {} : { tenantId: session.tenantId };

    // Parallel metrics fetch
    const [
        totalTickets,
        openTickets,
        resolvedTickets,
        breachedSLAs,
        tagStats
    ] = await Promise.all([
        prisma.supportTicket.count({ where: whereScope }),
        prisma.supportTicket.count({ where: { ...whereScope, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } } }),
        prisma.supportTicket.count({ where: { ...whereScope, status: 'RESOLVED' } }),
        prisma.supportSLATracking.count({
            where: {
                status: 'BREACHED',
                ticket: whereScope
            }
        }),
        prisma.supportTicketTagMap.groupBy({
            by: ['tagId'],
            _count: { tagId: true },
            orderBy: { _count: { tagId: 'desc' } },
            take: 5
        })
    ]);

    // Fetch tag names
    const topTags = [];
    for (const stat of tagStats) {
        const tag = await prisma.supportTicketTag.findUnique({ where: { id: stat.tagId } });
        if (tag) {
            topTags.push({ name: tag.name, count: stat._count.tagId });
        }
    }

    const resolutionRate = totalTickets ? ((resolvedTickets / totalTickets) * 100).toFixed(1) + '%' : '0%';

    return (
        <EnterprisePageShell
            title="Support Analytics & SLA Dashboard"
            description="Otomasyon kuralları, SLA ihlalleri ve destek performans verileriniz."
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/admin/support" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                    ← Monitöre Dön
                </Link>
            }
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-slate-800">
                    <h2 className="text-[11px] text-slate-400 uppercase font-bold tracking-widest text-center">Tüm Biletler</h2>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{totalTickets}</p>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10">
                    <h2 className="text-[11px] text-blue-500 uppercase font-bold tracking-widest text-center">Aktif Biletler</h2>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-400 mt-2">{openTickets}</p>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10">
                    <h2 className="text-[11px] text-green-600 uppercase font-bold tracking-widest text-center">Çözümleme Oranı</h2>
                    <p className="text-3xl font-black text-green-700 dark:text-green-500 mt-2">{resolutionRate}</p>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10 relative overflow-hidden">
                    <h2 className="text-[11px] text-rose-500 uppercase font-bold tracking-widest text-center z-10 relative">SLA Breaches</h2>
                    <p className="text-3xl font-black text-rose-700 dark:text-rose-500 mt-2 z-10 relative">{breachedSLAs}</p>
                    {breachedSLAs > 0 && <div className="absolute inset-0 bg-rose-500/5 dark:bg-rose-500/10 animate-pulse"></div>}
                </EnterpriseCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Most common categories via AI Tagging Engine */}
                <EnterpriseCard>
                    <EnterpriseSectionHeader title="En Çok Karşılaşılan Konular (Tags)" subtitle="AI Routing Engine tarafından biletlere otonom olarak eklenen etiket yoğunluk dağılımı." />

                    {topTags.length === 0 ? (
                        <div className="text-center py-6 text-slate-500">Yeterli etiket verisi bulunmuyor.</div>
                    ) : (
                        <div className="space-y-4">
                            {topTags.map((tag, i) => (
                                <div key={tag.name} className="flex items-center gap-4">
                                    <span className="w-6 text-center text-sm font-bold text-slate-300 dark:text-slate-700">#{i + 1}</span>
                                    <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{tag.name}</div>
                                    <div className="w-1/3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(tag.count / (topTags[0].count * 1.2)) * 100}%` }}></div>
                                    </div>
                                    <span className="w-10 text-right text-xs font-bold text-slate-600 dark:text-slate-400">{tag.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

                {/* Automation Rules Overview */}
                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Aktif Otomasyon ve SLA Kuralları" subtitle="Routing Engine ve SLA Monitor servislerinin mevcut hedefleri." />

                    <EnterpriseTable headers={['Öncelik', 'Tip', 'İlk Yanıt Hedefi', 'Çözüm Hedefi']}>
                        <tr>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-rose-100 text-rose-700">CRITICAL</span></td>
                            <td className="px-4 py-3 text-sm text-slate-700">Sistem Kesintisi</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">30 Dakika</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">4 Saat</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-orange-100 text-orange-700">HIGH</span></td>
                            <td className="px-4 py-3 text-sm text-slate-700">Modül Erişimsizliği</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">2 Saat</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">12 Saat</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600">NORMAL</span></td>
                            <td className="px-4 py-3 text-sm text-slate-700">Olası Hata / İstek</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">8 Saat</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">48 Saat</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-100 text-blue-600">LOW</span></td>
                            <td className="px-4 py-3 text-sm text-slate-700">Soru / Öneri</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">24 Saat</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">72 Saat</td>
                        </tr>
                    </EnterpriseTable>
                </EnterpriseCard>

            </div>
        </EnterprisePageShell>
    );
}
