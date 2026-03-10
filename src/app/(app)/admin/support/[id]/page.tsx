import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';
import { TicketCommentForm } from '@/components/help/TicketCommentForm';

export const metadata = {
    title: 'Destek Bileti İnceleme - Periodya Admin'
};

export default async function AdminSupportTicketDetailPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');
    const role = session.user?.role;
    const isPlatformAdmin = session.user?.tenantId === 'PLATFORM_ADMIN';

    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(role || '') && !isPlatformAdmin) {
        redirect('/');
    }

    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
        where: { id: id },
        include: {
            tenant: true,
            comments: { orderBy: { createdAt: 'asc' } },
            tags: { include: { tag: true } },
            slaTracking: true
        }
    });

    if (!ticket) {
        notFound();
    }

    // Role Guard
    if (!isPlatformAdmin && ticket.tenantId !== session.tenantId) {
        redirect('/admin/support');
    }

    const userIds = [...new Set(ticket.comments.map(c => c.userId))].filter(Boolean);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, role: true }
    });

    const userMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {} as Record<string, any>);

    const commentsWithUser = ticket.comments.map(c => ({
        ...c,
        authorUser: userMap[c.userId] || null
    }));

    const isSlaBreached = ticket.slaTracking?.status === 'BREACHED';

    return (
        <EnterprisePageShell
            title={`Bilet: ${ticket.subject}`}
            description={`${ticket.tenant?.name || 'Global'} / Bilet ID: ${ticket.id}`}
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/admin/support" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                    ← Monitor
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseCard>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between">
                            <span>Müşteri İletişim Geçmişi</span>
                            {isSlaBreached && <span className="text-[10px] text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded uppercase">SLA İhlali!</span>}
                        </h3>

                        <div className="space-y-6">
                            {/* Original */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold uppercase">
                                    M
                                </div>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 rounded-tl-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-sm">Müşteri</span>
                                        <span className="text-xs text-slate-400">{ticket.createdAt.toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">{ticket.description}</div>
                                </div>
                            </div>

                            {/* Comments */}
                            {commentsWithUser.map(c => (
                                <div key={c.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold uppercase">
                                        {c.authorType === 'USER' ? 'M' : 'A'}
                                    </div>
                                    <div className={`flex-1 p-4 rounded-2xl border ${c.authorType === 'SUPPORT_AGENT' || c.authorType === 'SYSTEM' ? 'bg-indigo-50/50 dark:bg-indigo-900/20 rounded-tl-sm border-indigo-100 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900 rounded-tl-sm border-slate-100 dark:border-slate-800'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm">
                                                {c.authorType === 'SYSTEM' ? 'Sistem Botu' : (c.authorUser?.name || (c.authorType === 'USER' ? 'Müşteri' : 'Destek Ekibi'))}
                                            </span>
                                            <span className="text-xs text-slate-400">{c.createdAt.toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">{c.message}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply as Admin */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">Müşteriye Yanıt Ver</h4>
                            <p className="text-xs text-slate-500 mb-2">Not: Yanıt yazdığınızda destek talebinin durumu varsayılan olarak "Müşteri Yanıtı Bekliyor" konumuna dönecektir ve SLA sayacı duraklatılacaktır.</p>
                            <TicketCommentForm ticketId={ticket.id} initialStatus={ticket.status} />
                        </div>
                    </EnterpriseCard>

                    {/* Metadata Debug (Platform Doctor Logic) */}
                    {(ticket.metadataJson as any)?.platformDoctor && (
                        <EnterpriseCard className="bg-slate-900 border-slate-800 text-slate-300">
                            <h3 className="font-semibold text-white text-sm mb-4">Platform Doctor Analysis Matrix</h3>
                            <pre className="text-[10px] overflow-auto max-h-40">
                                {JSON.stringify((ticket.metadataJson as any).platformDoctor, null, 2)}
                            </pre>
                        </EnterpriseCard>
                    )}
                </div>

                {/* Sidebar Details / Actions */}
                <div className="space-y-6">
                    <EnterpriseCard>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Talep & SLA Bilgileri</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Durumu</label>
                                <div className="mt-1">
                                    <span className={`px-2 py-1 inline-block rounded text-[10px] font-bold tracking-wider ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-700' : ticket.status === 'WAITING_USER' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Öncelik Derecesi</label>
                                <div className="mt-1">
                                    <span className={`px-2 py-1 inline-block rounded text-[10px] font-bold tracking-wider ${ticket.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : ticket.priority === 'LOW' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                            </div>

                            {ticket.slaTracking && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SLA Target Resolution</label>
                                    <div className={`mt-1 text-xs font-medium ${ticket.slaTracking.status === 'BREACHED' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {ticket.slaTracking.resolutionDeadline.toLocaleString('tr-TR')}
                                    </div>
                                </div>
                            )}

                            {ticket.tags.length > 0 && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Otomasyon Etiketleri</label>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {ticket.tags.map(t => (
                                            <span key={t.tagId} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-semibold">#{t.tag.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </EnterpriseCard>

                    {/* Admin Actions */}
                    <EnterpriseCard>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-4">Yetkili İşlemleri</h3>
                        <div className="space-y-3">
                            <form action={`/api/support/tickets/${ticket.id}/actions?type=ESCALATE`} method="POST">
                                <button type="submit" disabled={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                                    Daha Üst Ekibe İlet
                                </button>
                            </form>

                            <form action={`/api/support/tickets/${ticket.id}/actions?type=RESOLVE`} method="POST">
                                <button type="submit" disabled={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
                                    Talebi Çözüldü İşaretle
                                </button>
                            </form>

                            <form action={`/api/support/tickets/${ticket.id}/actions?type=CLOSE`} method="POST">
                                <button type="submit" disabled={ticket.status === 'CLOSED'} className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
                                    Bileti Tamamen Kapat
                                </button>
                            </form>
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
