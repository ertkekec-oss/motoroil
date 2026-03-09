import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';
import { TicketCommentForm } from '@/components/help/TicketCommentForm';

export const metadata = {
    title: 'Talep Detayı - Periodya'
};

export default async function SupportTicketDetailPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');

    // next 15 async route access
    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
        where: { id: id },
        include: {
            comments: { orderBy: { createdAt: 'asc' }, include: { authorUser: { select: { name: true, role: true } } } },
            tags: { include: { tag: true } }
        }
    });

    if (!ticket) {
        notFound();
    }

    if (ticket.tenantId !== session.tenantId) {
        redirect('/help/tickets');
    }

    return (
        <EnterprisePageShell
            title={`Talep: ${ticket.subject}`}
            description={`Oluşturulma: ${ticket.createdAt.toLocaleString('tr-TR')} | ID: ${ticket.id}`}
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/help/tickets" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                    ← Tüm Talepler
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (History & Conversation) */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseCard>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Mesajlaşma Geçmişi</h3>

                        <div className="space-y-6">
                            {/* Original Description as first message */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold uppercase">
                                    {session.user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-sm">{session.user?.name || 'Kullanıcı'} (Siz)</span>
                                        <span className="text-xs text-slate-400">{ticket.createdAt.toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                        {ticket.description}
                                    </div>
                                </div>
                            </div>

                            {/* Comments array */}
                            {ticket.comments.map(c => (
                                <div key={c.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold uppercase">
                                        {c.authorType === 'USER' ? (c.authorUser?.name?.charAt(0) || 'U') : 'A'}
                                    </div>
                                    <div className={`flex-1 p-4 rounded-2xl border ${c.authorType === 'SUPPORT_AGENT' || c.authorType === 'SYSTEM' ? 'bg-indigo-50/50 dark:bg-indigo-900/20 rounded-tl-sm border-indigo-100 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900 rounded-tl-sm border-slate-100 dark:border-slate-800'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm">
                                                {c.authorType === 'SYSTEM' ? 'Sistem & AI' : (c.authorUser?.name || 'Destek Ekibi')}
                                                {c.authorType === 'SUPPORT_AGENT' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Uzman</span>}
                                            </span>
                                            <span className="text-xs text-slate-400">{c.createdAt.toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                            {c.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comment Form */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">Cevap Yaz</h4>
                            <TicketCommentForm ticketId={ticket.id} initialStatus={ticket.status} />
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <EnterpriseCard>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Talep Bilgileri</h3>

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

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kategori Modülü</label>
                                <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {ticket.category.replace('_', ' ')}
                                </div>
                            </div>

                            {ticket.tags.length > 0 && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Etiketler</label>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {ticket.tags.map(t => (
                                            <span key={t.tagId} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-semibold">#{t.tag.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {ticket.browserInfo && (
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cihaz / Tarayıcı</label>
                                    <div className="mt-1 text-xs text-slate-500 break-words dark:text-slate-400">
                                        {ticket.browserInfo}
                                    </div>
                                </div>
                            )}
                        </div>
                    </EnterpriseCard>

                    {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                        <EnterpriseCard className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30">
                            <h3 className="font-semibold text-rose-900 dark:text-rose-100 text-sm mb-2">Talebi Kapatmak İster misiniz?</h3>
                            <p className="text-xs text-rose-700/80 dark:text-rose-200/60 mb-4">
                                Eğer sorununuz başarıyla çözüldüyse veya desteğe daha fazla ihtiyacınız yoksa bu talebi kapatabilirsiniz.
                            </p>
                            <form action={`/api/support/tickets/${ticket.id}/actions?type=RESOLVE`} method="POST">
                                <button type="submit" className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg text-sm font-semibold transition-colors">Sorunum Çözüldü</button>
                            </form>
                        </EnterpriseCard>
                    )}
                </div>
            </div>
        </EnterprisePageShell>
    );
}
