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
    NEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    WAITING_CUSTOMER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/20',
    CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function AttachmentLink({ attachment }: { attachment: any }) {
    return (
        <a
            href={`/api/support/attachments/${attachment.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all font-medium"
        >
            <span>📎</span>
            <span className="truncate max-w-[120px]">{attachment.fileName}</span>
            <span className="text-[10px] text-gray-600">({(attachment.size / 1024).toFixed(0)} KB)</span>
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
                        <h1 className="text-2xl font-black text-white truncate">#{ticket.ticketNumber} - {ticket.subject}</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4 custom-scrollbar">
                    {/* Original Request */}
                    <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                            <div className="font-bold text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">M</span>
                                {ticket.requesterUserId} (Müşteri)
                            </div>
                            <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed mb-4">
                            {ticket.description}
                        </div>
                        {ticket.attachments && (ticket.attachments as any).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
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
                            <div key={msg.id} className={`p-6 rounded-2xl shadow-xl w-full border ${isInternal ? 'bg-yellow-900/10 border-yellow-500/30' : isSystem ? 'bg-gray-900/50 border-gray-500/20' : isAdmin ? 'bg-orange-900/10 border-orange-500/20' : 'bg-[#0f111a] border-white/5'}`}>
                                <div className={`flex items-center justify-between mb-4 border-b pb-4 ${isInternal ? 'border-yellow-500/20' : isAdmin ? 'border-orange-500/10' : 'border-white/5'}`}>
                                    <div className="font-bold text-white flex items-center gap-2">
                                        {isCustomer && <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">M</span>}
                                        {isAdmin && <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">A</span>}
                                        {isSystem && <span className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs">S</span>}

                                        <span className={isInternal ? 'text-yellow-500' : isAdmin ? 'text-orange-400' : 'text-white'}>
                                            {isCustomer ? 'Müşteri' : isAdmin ? `Destek: ${msg.authorId}` : 'Sistem Botu'}
                                            {isInternal && ' [İÇ NOT]'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString('tr-TR')}</div>
                                </div>
                                <div className={`${isInternal ? 'text-yellow-100' : 'text-gray-300'} whitespace-pre-wrap text-sm leading-relaxed mb-4`}>
                                    {msg.body}
                                </div>
                                {msg.attachments && (msg.attachments as any).length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
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
                <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-white font-bold mb-4 border-b border-white/5 pb-2">Yönetim Paneli</h3>
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
                <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-white font-bold mb-4 border-b border-white/5 pb-2">Context & Metadata</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-gray-500 block mb-1">Tenant ID (Kiracı)</span>
                            <span className="text-sm font-mono text-blue-400 break-all">{ticket.tenantId}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block mb-1">User ID (Talep Eden)</span>
                            <span className="text-sm font-mono text-blue-400 break-all">{ticket.requesterUserId}</span>
                        </div>
                        {metadataJson.url && (
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Oluşturulan Sayfa</span>
                                <a href={metadataJson.url} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-400 hover:underline break-all">
                                    {metadataJson.url}
                                </a>
                            </div>
                        )}
                        {metadataJson.userAgent && (
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Tarayıcı Bilgisi</span>
                                <span className="text-[10px] font-mono text-gray-500 break-words leading-tight block">{metadataJson.userAgent}</span>
                            </div>
                        )}
                        {ticket.relatedHelpTopic && (
                            <div className="pt-4 mt-4 border-t border-white/5">
                                <span className="text-xs text-gray-500 block mb-1">İlgili Yardım Dokümanı</span>
                                <Link href={`/help/${ticket.relatedHelpTopic.slug}`} target="_blank" className="text-sm text-white font-bold hover:text-orange-400 transition-colors">
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
