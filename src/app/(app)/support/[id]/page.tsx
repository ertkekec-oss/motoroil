import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import ReplyForm from './ReplyForm';

export const metadata = {
    title: 'Destek Talebi Detayı - Periodya'
};

const STATUS_LABELS: Record<string, string> = {
    NEW: 'Yeni',
    IN_PROGRESS: 'İşlemde',
    WAITING_CUSTOMER: 'Yanıtınızı Bekliyor',
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

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');

    const ticket = await prisma.ticket.findUnique({
        where: { id: params.id },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            },
            relatedHelpTopic: true
        }
    });

    if (!ticket || ticket.tenantId !== session.tenantId) {
        notFound();
    }

    if (session.role === 'USER' && ticket.requesterUserId !== session.id) {
        notFound();
    }

    const { messages } = ticket;

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto font-sans flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="mb-6 flex-shrink-0">
                <Link href="/support" className="text-orange-500 hover:underline flex items-center gap-1 text-sm font-medium mb-4">
                    ← Taleplerime Dön
                </Link>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-black text-white">#{ticket.ticketNumber} - {ticket.subject}</h1>
                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[ticket.status]}`}>
                                {STATUS_LABELS[ticket.status]}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Oluşturulma: {new Date(ticket.createdAt).toLocaleString('tr-TR')} • Kategori: {ticket.category}</p>
                    </div>
                </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4 custom-scrollbar">
                {/* Original Description */}
                <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                        <div className="font-bold text-white flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs">SEN</span>
                            Siz
                        </div>
                        <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                        {ticket.description}
                    </div>
                </div>

                {/* Messages */}
                {messages.map((msg) => {
                    // Müşteriye gizli (Internal) mesajlar sadece Admin panelinde görünür.
                    if (msg.isInternal) return null;

                    const isSystem = msg.authorType === 'SYSTEM';
                    const isAdmin = msg.authorType === 'ADMIN';
                    const isMe = msg.authorType === 'CUSTOMER';

                    return (
                        <div key={msg.id} className={`p-6 rounded-2xl shadow-xl w-full border ${isSystem ? 'bg-blue-900/10 border-blue-500/20' : isAdmin ? 'bg-orange-900/10 border-orange-500/20' : 'bg-[#0f111a] border-white/5'}`}>
                            <div className={`flex items-center justify-between mb-4 border-b pb-4 ${isSystem ? 'border-blue-500/10' : isAdmin ? 'border-orange-500/10' : 'border-white/5'}`}>
                                <div className="font-bold text-white flex items-center gap-2">
                                    {isMe && <span className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xs">SEN</span>}
                                    {isAdmin && <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">A</span>}
                                    {isSystem && <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">S</span>}

                                    <span className={isAdmin ? 'text-orange-400' : isSystem ? 'text-blue-400' : 'text-white'}>
                                        {isMe ? 'Siz' : isAdmin ? 'Destek Ekibi' : 'Sistem Botu'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString('tr-TR')}</div>
                            </div>
                            <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                {msg.body}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reply Input Area */}
            {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' ? (
                <div className="mt-6 flex-shrink-0">
                    <ReplyForm ticketId={ticket.id} />
                </div>
            ) : (
                <div className="mt-6 p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-center flex-shrink-0 text-gray-400 text-sm">
                    Bu talep kapatıldığı için yeni mesaj gönderemezsiniz. Yardıma ihtiyacınız varsa yeni bir talep oluşturabilirsiniz.
                </div>
            )}
        </div>
    );
}
