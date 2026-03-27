import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseEmptyState } from '@/components/ui/enterprise';

export const metadata = {
    title: 'Destek Yönetimi - Periodya Admin'
};

export default async function AdminSupportListPage({
    searchParams
}: {
    searchParams: { status?: string; priority?: string }
}) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');
    const role = session.user?.role;
    const isPlatformAdmin = session.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role || '') && !isPlatformAdmin) {
        redirect('/');
    }

    const { status, priority } = await searchParams;

    const whereClause: any = {};
    if (!isPlatformAdmin) {
        whereClause.tenantId = session.tenantId;
    }
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
        where: whereClause,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: { _count: { select: { comments: true } } },
        take: 100
    });

    return (
        <EnterprisePageShell
            title="Destek Yönetimi Monitörü"
            description="Tüm açık/kapalı biletleri ve SLA durumlarını buradan yönetin."
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
            actions={
                <div className="flex gap-2">
                    <Link href="/admin/support/analytics" className="px-5 py-2 inline-flex items-center justify-center rounded-xl text-[11px] uppercase tracking-widest font-black border border-slate-300 dark:border-white/10 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                        Analitik Merkezi
                    </Link>
                </div>
            }
        >
            {/* Filters */}
            <EnterpriseCard className="mb-8 flex flex-wrap gap-3 p-4! border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-2">Filtreler:</span>
                <Link 
                    href="/admin/support" 
                    className={`inline-flex px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-colors shadow-sm ${!status && !priority ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Tümü
                </Link>
                <Link 
                    href="/admin/support?status=OPEN" 
                    className={`inline-flex px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-colors shadow-sm ${status === 'OPEN' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Yeni Gelenler
                </Link>
                <Link 
                    href="/admin/support?status=WAITING_USER" 
                    className={`inline-flex px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-colors shadow-sm ${status === 'WAITING_USER' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Müşteri Yanıtı Bekleyen
                </Link>
                <Link 
                    href="/admin/support?priority=CRITICAL" 
                    className={`inline-flex px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-colors shadow-sm ${priority === 'CRITICAL' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Kritik & SLA İhlali Olası
                </Link>
            </EnterpriseCard>

            <EnterpriseCard noPadding className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b]">
                {tickets.length === 0 ? (
                    <EnterpriseEmptyState
                        title="İlgili kriterlere uygun destek talebi bulunamadı."
                        description="Şu an her şey yolunda görünüyor. Gelen kutusu boş."
                        icon="📭"
                    />
                ) : (
                    <EnterpriseTable
                        headers={['ID', 'Tenant', 'Konu', 'Kategori', 'Öncelik', 'Durum', 'Tarih', 'Aksiyonlar']}
                    >
                        {tickets.map(ticket => (
                            <tr key={ticket.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group ${ticket.priority === 'CRITICAL' && ticket.status === 'OPEN' ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''}`}>
                                <td className="px-4 py-3 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                    {ticket.id.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate max-w-[150px] border-b border-slate-100 dark:border-white/5">
                                    {ticket.tenantId}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] border-b border-slate-100 dark:border-white/5">
                                    {ticket.subject}
                                </td>
                                <td className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                    {ticket.category.replace('_', ' ')}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ticket.priority === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' : ticket.priority === 'HIGH' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' : ticket.priority === 'LOW' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'}`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : ticket.status === 'WAITING_USER' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
                                    {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-4 py-3 text-right border-b border-slate-100 dark:border-white/5">
                                    <Link href={`/admin/support/${ticket.id}`} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] uppercase tracking-widest font-black whitespace-nowrap transition-colors border border-slate-200 dark:border-white/10 opacity-0 group-hover:opacity-100">
                                        İncele & Yanıtla
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>

        </EnterprisePageShell>
    );
}
