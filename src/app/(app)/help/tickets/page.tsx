import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseTable, EnterpriseEmptyState } from '@/components/ui/enterprise';

export const metadata = {
    title: 'Destek Taleplerim - Periodya',
};

export default async function SupportTicketsPage() {
    const session = await getSession();
    if (!session?.tenantId) {
        redirect('/login');
    }

    const tickets = await prisma.supportTicket.findMany({
        where: { tenantId: session.tenantId, createdByUserId: session.id },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { comments: true } } }
    });

    return (
        <EnterprisePageShell
            title="Destek Taleplerim"
            description="Açtığınız tüm destek taleplerinin listesi ve detayları."
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/help/tickets/new" className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                    Yeni Talep Oluştur
                </Link>
            }
        >
            <EnterpriseCard noPadding>
                {tickets.length === 0 ? (
                    <EnterpriseEmptyState
                        title="Henüz destek talebiniz bulunmuyor."
                        description="Yardıma ihtiyacınız olduğunda yeni bir talep oluşturabilirsiniz."
                        icon="🛈"
                    />
                ) : (
                    <EnterpriseTable
                        headers={[
                            '#ID',
                            'Konu',
                            'Kategori',
                            'Öncelik',
                            'Durum',
                            'Yorum Sayısı',
                            'Tarih',
                            { label: 'İşlem', alignRight: true }
                        ]}
                    >
                        {tickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                                    {ticket.id.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                                    {ticket.subject}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">
                                    {ticket.category.replace('_', ' ')}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${ticket.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : ticket.priority === 'LOW' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-700' : ticket.status === 'WAITING_USER' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-500 text-center">
                                    {ticket._count.comments}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-500">
                                    {ticket.createdAt.toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/help/tickets/${ticket.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-200 hover:text-blue-600 transition-colors">
                                        Detay →
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
