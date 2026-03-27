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
            title="Destek Analizleri (SLA Dashboard)"
            description="Otomasyon kuralları, SLA ihlalleri ve destek performans verileriniz."
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
            actions={
                <Link href="/admin/support" className="px-5 py-2 inline-flex items-center justify-center rounded-xl text-[11px] uppercase tracking-widest font-black border border-slate-300 dark:border-white/10 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                    ← Monitöre Dön
                </Link>
            }
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b]">
                    <h2 className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest text-center">Tüm Biletler</h2>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">{totalTickets}</p>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10">
                    <h2 className="text-[11px] text-blue-600 dark:text-blue-400 uppercase font-black tracking-widest text-center">Aktif Biletler</h2>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-2 font-mono">{openTickets}</p>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10">
                    <h2 className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-widest text-center">Çözümleme Oranı</h2>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2 font-mono">{resolutionRate}</p>
                </EnterpriseCard>

                <EnterpriseCard className="flex flex-col justify-center items-center p-6! border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10 relative overflow-hidden">
                    <h2 className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-black tracking-widest text-center z-10 relative">SLA Breaches (İhlaller)</h2>
                    <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-2 z-10 relative font-mono">{breachedSLAs}</p>
                    {breachedSLAs > 0 && <div className="absolute inset-0 bg-rose-500/10 dark:bg-rose-500/20 animate-pulse"></div>}
                </EnterpriseCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Most common categories via AI Tagging Engine */}
                <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b]">
                    <EnterpriseSectionHeader title="En Çok Karşılaşılan Konular (Tags)" subtitle="AI Routing Engine tarafından biletlere otonom olarak eklenen etiket yoğunluk dağılımı." />

                    {topTags.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3 border border-slate-200 dark:border-white/5 shadow-sm">
                                📊
                            </div>
                            <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Yeterli etiket verisi bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topTags.map((tag, i) => (
                                <div key={tag.name} className="flex items-center gap-4 group">
                                    <span className="w-6 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">#{i + 1}</span>
                                    <div className="flex-1 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">{tag.name}</div>
                                    <div className="w-1/3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 dark:bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(tag.count / (topTags[0].count * 1.2)) * 100}%` }}></div>
                                    </div>
                                    <span className="w-10 text-right text-[11px] font-mono font-black text-slate-600 dark:text-slate-400">{tag.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

                {/* Automation Rules Overview */}
                <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] p-0 overflow-hidden">
                    <div className="p-6">
                        <EnterpriseSectionHeader title="Aktif Otomasyon ve SLA Kuralları" subtitle="Routing Engine ve SLA Monitor servislerinin mevcut hedefleri." />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-white/5">
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Öncelik</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Tip</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">İlk Yanıt Hedefi</th>
                                    <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Çözüm Hedefi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30">CRITICAL</span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Sistem Kesintisi</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">30 Dakika</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">4 Saat</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30">HIGH</span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Modül Erişimsizliği</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">2 Saat</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">12 Saat</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10">NORMAL</span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Olası Hata / İstek</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">8 Saat</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">48 Saat</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors border-b-0">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/30">LOW</span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Soru / Öneri</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">24 Saat</td>
                                    <td className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">72 Saat</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}
