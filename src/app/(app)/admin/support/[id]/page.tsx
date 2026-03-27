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

    const tenantCompany = await prisma.company.findUnique({
        where: { id: ticket.tenantId },
        select: { name: true }
    });

    return (
        <EnterprisePageShell
            title={`Bilet: ${ticket.subject}`}
            description={`${tenantCompany?.name || ticket.tenantId || 'Global'} / Bilet ID: ${ticket.id}`}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
            actions={
                <Link href="/admin/support" className="px-5 py-2 inline-flex items-center justify-center rounded-xl text-[11px] uppercase tracking-widest font-black border border-slate-300 dark:border-white/10 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                    ← Monitöre Dön
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b]">
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 mb-6 flex justify-between items-center">
                            <span>Müşteri İletişim Geçmişi</span>
                            {isSlaBreached && <span className="text-[10px] text-rose-800 dark:text-rose-400 font-black bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-2 py-0.5 rounded-lg uppercase tracking-widest">SLA İhlali!</span>}
                        </h3>

                        <div className="space-y-6">
                            {/* Original */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                                    M
                                </div>
                                <div className="flex-1 bg-slate-50 dark:bg-[#0f172a]/50 p-5 rounded-2xl border border-slate-200 dark:border-white/5 rounded-tl-sm shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Müşteri</span>
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">{new Date(ticket.createdAt).toISOString().replace('T', ' ').substring(0, 19)}</span>
                                    </div>
                                    <div className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">{ticket.description}</div>
                                </div>
                            </div>

                            {/* Comments */}
                            {commentsWithUser.map(c => (
                                <div key={c.id} className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full border shrink-0 flex items-center justify-center font-black uppercase tracking-widest ${c.authorType === 'SUPPORT_AGENT' || c.authorType === 'SYSTEM' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'}`}>
                                        {c.authorType === 'USER' ? 'M' : 'A'}
                                    </div>
                                    <div className={`flex-1 p-5 rounded-2xl border rounded-tl-sm shadow-sm ${c.authorType === 'SUPPORT_AGENT' || c.authorType === 'SYSTEM' ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-[#0f172a]/50 border-slate-200 dark:border-white/5'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                                {c.authorType === 'SYSTEM' ? 'Sistem Botu' : (c.authorUser?.name || (c.authorType === 'USER' ? 'Müşteri' : 'Destek Ekibi'))}
                                            </span>
                                            <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">{new Date(c.createdAt).toISOString().replace('T', ' ').substring(0, 19)}</span>
                                        </div>
                                        <div className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">{c.message}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply as Admin */}
                        <div className="border-t border-slate-200 dark:border-white/5 pt-6 mt-8">
                            <h4 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Müşteriye Yanıt Ver</h4>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">Not: Yanıt verdiğinizde destek talebinin durumu varsayılan olarak "Müşteri Yanıtı Bekliyor" konumuna dönecektir ve SLA sayacı duraklatılacaktır.</p>
                            <TicketCommentForm ticketId={ticket.id} initialStatus={ticket.status} />
                        </div>
                    </EnterpriseCard>

                    {/* Metadata Debug (Platform Doctor Logic) */}
                    {(ticket.metadataJson as any)?.platformDoctor && (
                        <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-slate-900 dark:bg-[#1e293b] text-slate-300 p-0 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 dark:border-white/5 bg-slate-900/50 dark:bg-slate-800/50">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Platform Doctor Analiz Matrisi</h3>
                            </div>
                            <div className="px-6 py-4 p-0">
                                <pre className="text-[10px] font-mono leading-relaxed overflow-auto max-h-40 text-slate-400 p-6">
                                    {JSON.stringify((ticket.metadataJson as any).platformDoctor, null, 2)}
                                </pre>
                            </div>
                        </EnterpriseCard>
                    )}
                </div>

                {/* Sidebar Details / Actions */}
                <div className="space-y-6">
                    <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b]">
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 mb-6">Talep & SLA Bilgileri</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Durumu</label>
                                <div>
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : ticket.status === 'WAITING_USER' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Öncelik Derecesi</label>
                                <div>
                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ticket.priority === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' : ticket.priority === 'HIGH' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' : ticket.priority === 'LOW' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                            </div>

                            {ticket.slaTracking && (
                                <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest block mb-1">SLA Hedef Çözüm Zamanı</label>
                                    <div className={`text-[11px] font-mono font-black uppercase tracking-widest ${ticket.slaTracking.status === 'BREACHED' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {new Date(ticket.slaTracking.resolutionDeadline).toISOString().replace('T', ' ').substring(0, 19)}
                                    </div>
                                </div>
                            )}

                            {ticket.tags.length > 0 && (
                                <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Otomasyon Etiketleri</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ticket.tags.map(t => (
                                            <span key={t.tagId} className="inline-flex px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-lg font-black uppercase tracking-widest">
                                                #{t.tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </EnterpriseCard>

                    {/* Admin Actions */}
                    <EnterpriseCard className="border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#1e293b]/50">
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Yetkili Aksiyonları</h3>
                        <div className="space-y-3">
                            <form action={`/api/support/tickets/${ticket.id}/actions?type=ESCALATE`} method="POST">
                                <button type="submit" disabled={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'} className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[11px] uppercase tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 shadow-sm disabled:cursor-not-allowed text-center flex justify-center items-center">
                                    Daha Üst Ekibe Escalation Et
                                </button>
                            </form>

                            <form action={`/api/support/tickets/${ticket.id}/actions?type=RESOLVE`} method="POST">
                                <button type="submit" disabled={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'} className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600/90 dark:hover:bg-emerald-600 text-white font-black rounded-xl text-[11px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-center flex justify-center items-center">
                                    Talebi Çözüldü İşaretle
                                </button>
                            </form>

                            <form action={`/api/support/tickets/${ticket.id}/actions?type=CLOSE`} method="POST">
                                <button type="submit" disabled={ticket.status === 'CLOSED'} className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-black rounded-xl text-[11px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-center flex justify-center items-center">
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
