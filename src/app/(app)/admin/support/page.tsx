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
            title="Destek Talepleri Monitörü"
            description="Tüm açık/kapalı biletleri ve SLA durumlarını buradan yönetin."
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <div className="flex gap-2">
                    <Link href="/admin/support/analytics" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                        Analytics Hub
                    </Link>
                </div>
            }
        >
            {/* Filters */}
            <EnterpriseCard className="mb-6 flex gap-4 overflow-x-auto p-4!">
                <Link href="/admin/support" className={`px-4 py-1.5 rounded-lg text-sm font-medium ${!status && !priority ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tümü</Link>
                <Link href="/admin/support?status=OPEN" className={`px-4 py-1.5 rounded-lg text-sm font-medium ${status === 'OPEN' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Yeni Gelenler</Link>
                <Link href="/admin/support?status=WAITING_USER" className={`px-4 py-1.5 rounded-lg text-sm font-medium ${status === 'WAITING_USER' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Müşteri Yanıtı Bekleyen</Link>
                <Link href="/admin/support?priority=CRITICAL" className={`px-4 py-1.5 rounded-lg text-sm font-medium ${priority === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Kritik SLA Onaylı</Link>
            </EnterpriseCard>

            <EnterpriseCard noPadding>
                {tickets.length === 0 ? (
                    <EnterpriseEmptyState
                        title="İlgili kriterlere uygun destek talebi bulunamadı."
                        description="Şu an her şey yolunda görünüyor. Inbox boş."
                        icon="📭"
                    />
                ) : (
                    <EnterpriseTable
                        headers={['ID', 'Tenant', 'Konu', 'Kategori', 'Öncelik', 'Durum', 'Tarih', '']}
                    >
                        {tickets.map(ticket => (
                            <tr key={ticket.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${ticket.priority === 'CRITICAL' && ticket.status === 'OPEN' ? 'bg-rose-50/30' : ''}`}>
                                <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                                    {ticket.id.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700 font-semibold truncate max-w-[150px]">
                                    {ticket.tenantId}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                                    {ticket.subject}
                                </td>
                                <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    {ticket.category.replace('_', ' ')}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider ${ticket.priority === 'CRITICAL' ? 'bg-rose-600 text-white' : ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : ticket.priority === 'LOW' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider uppercase ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-700' : ticket.status === 'WAITING_USER' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[10px] uppercase font-bold text-slate-400">
                                    {new Date(ticket.createdAt).toISOString().substring(0, 10).split('-').reverse().join('.')}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/admin/support/${ticket.id}`} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold whitespace-nowrap transition-colors">
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
