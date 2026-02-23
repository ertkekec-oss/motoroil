import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import AdminReplyForm from './AdminReplyForm';
import UpdateControls from './UpdateControls';

export const metadata = {
    title: 'Destek Talebi İnceleme - Admin'
};

const STATUS_LABELS: Record<string, string> = {
    NEW: 'Yeni (Bekleyen)',
    IN_PROGRESS: 'İşlemde',
    WAITING_CUSTOMER: 'Müşteri Cevabı Bekleniyor',
    RESOLVED: 'Çözümlendi',
    CLOSED: 'Kapatıldı',
};

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    WAITING_CUSTOMER: 'bg-purple-50 text-purple-700 border-purple-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-50 text-slate-700 border-slate-200',
};

function AttachmentLink({ attachment }: { attachment: any }) {
    return (
        <a
            href={`/api/support/attachments/${attachment.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 hover:text-orange-600 hover:bg-slate-100 transition-all font-medium"
        >
            <span>📎</span>
            <span className="truncate max-w-[120px]">{attachment.fileName}</span>
            <span className="text-[10px] text-slate-400">({(attachment.size / 1024).toFixed(0)} KB)</span>
        </a>
    );
}

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    // RBAC
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        redirect('/login');
    }

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                include: { attachments: true }
            },
            attachments: {
                where: { messageId: null }
            },
            relatedHelpTopic: true
        }
    });

    if (!ticket) notFound();

    // Fetch support agents for assignment
    const agents = await prisma.user.findMany({
        where: {
            role: { in: ['SUPPORT_AGENT', 'SUPER_ADMIN'] }
        },
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    const { messages } = ticket;
    const metadataJson = ticket.metadataJson as any || {};

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
            {/* Conversation Area - Workspace */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="mb-6 flex-shrink-0">
                    <Link href="/admin/support/tickets" className="text-orange-500 hover:underline flex items-center gap-1 text-sm font-medium mb-4">
                        ← Inbox'a Dön
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-black text-slate-900 truncate">#{ticket.ticketNumber} - {ticket.subject}</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4 custom-scrollbar">
                    {/* Original Request */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs text-bold">M</span>
                                {ticket.requesterUserId} (Müşteri)
                            </div>
                            <div className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed mb-4">
                            {ticket.description}
                        </div>
                        {ticket.attachments && (ticket.attachments as any).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                                {(ticket.attachments as any).map((att: any) => (
                                    <AttachmentLink key={att.id} attachment={att} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    {messages.map((msg) => {
                        const isSystem = msg.authorType === 'SYSTEM';
                        const isAdmin = msg.authorType === 'ADMIN';
                        const isCustomer = msg.authorType === 'CUSTOMER';
                        const isInternal = msg.isInternal;

                        return (
                            <div key={msg.id} className={`p-6 rounded-2xl shadow-sm w-full border ${isInternal ? 'bg-amber-50 border-amber-500/30' : isSystem ? 'bg-slate-50 border-slate-200' : isAdmin ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-slate-200'}`}>
                                <div className={`flex items-center justify-between mb-4 border-b pb-4 ${isInternal ? 'border-amber-500/20' : isAdmin ? 'border-orange-500/10' : 'border-slate-100'}`}>
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                        {isCustomer && <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">M</span>}
                                        {isAdmin && <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">A</span>}
                                        {isSystem && <span className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold">S</span>}

                                        <span className={isInternal ? 'text-amber-700' : isAdmin ? 'text-orange-600' : 'text-slate-900'}>
                                            {isCustomer ? 'Müşteri' : isAdmin ? `Destek: ${msg.authorId}` : 'Sistem Botu'}
                                            {isInternal && ' [İÇ NOT]'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString('tr-TR')}</div>
                                </div>
                                <div className={`${isInternal ? 'text-amber-900' : 'text-slate-700'} whitespace-pre-wrap text-sm leading-relaxed mb-4`}>
                                    {msg.body}
                                </div>
                                {msg.attachments && (msg.attachments as any).length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                                        {(msg.attachments as any).map((att: any) => (
                                            <AttachmentLink key={att.id} attachment={att} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 flex-shrink-0">
                    <AdminReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
                </div>
            </div>

            {/* Sidebar Context */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                {/* Status Card & Assignment */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-slate-900 font-bold mb-4 border-b border-slate-100 pb-2 uppercase text-[10px] tracking-widest">Yönetim Paneli</h3>
                    <div className="space-y-4">
                        <UpdateControls
                            ticketId={ticket.id}
                            assignedToUserId={ticket.assignedToUserId}
                            priority={ticket.priority}
                            agents={agents}
                            STATUS_COLORS={STATUS_COLORS}
                            STATUS_LABELS={STATUS_LABELS}
                            currentStatus={ticket.status}
                        />
                    </div>
                </div>

                {/* Metadata Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-slate-900 font-bold mb-4 border-b border-slate-100 pb-2 uppercase text-[10px] tracking-widest">Context & Metadata</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-slate-500 block mb-1">Tenant ID (Kiracı)</span>
                            <span className="text-sm font-mono text-blue-600 break-all">{ticket.tenantId}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block mb-1">User ID (Talep Eden)</span>
                            <span className="text-sm font-mono text-blue-600 break-all">{ticket.requesterUserId}</span>
                        </div>
                        {metadataJson.url && (
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Oluşturulan Sayfa</span>
                                <a href={metadataJson.url} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 font-bold hover:underline break-all">
                                    {metadataJson.url}
                                </a>
                            </div>
                        )}
                        {metadataJson.userAgent && (
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Tarayıcı Bilgisi</span>
                                <span className="text-[10px] font-mono text-slate-400 break-words leading-tight block">{metadataJson.userAgent}</span>
                            </div>
                        )}
                        {ticket.relatedHelpTopic && (
                            <div className="pt-4 mt-4 border-t border-slate-100">
                                <span className="text-xs text-slate-500 block mb-1">İlgili Yardım Dokümanı</span>
                                <Link href={`/help/${ticket.relatedHelpTopic.slug}`} target="_blank" className="text-sm text-slate-900 font-bold hover:text-orange-600 transition-colors">
                                    {ticket.relatedHelpTopic.title} ↗
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
