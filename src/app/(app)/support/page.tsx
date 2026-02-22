import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
    title: 'Destek Taleplerim - Periodya',
};

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    WAITING_CUSTOMER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/20',
    CLOSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const STATUS_LABELS: Record<string, string> = {
    NEW: 'Yeni',
    IN_PROGRESS: 'İşlemde',
    WAITING_CUSTOMER: 'Yanıtınızı Bekliyor',
    RESOLVED: 'Çözümlendi',
    CLOSED: 'Kapatıldı',
};

const PRIORITY_LABELS: Record<string, string> = {
    P1_URGENT: '‼️ Acil',
    P2_HIGH: '❗️ Yüksek',
    P3_NORMAL: 'Normal',
    P4_LOW: 'Düşük',
};

export default async function SupportPage() {
    const session = await getSession();
    if (!session?.tenantId) {
        redirect('/login');
    }

    const tickets = await prisma.ticket.findMany({
        where: {
            tenantId: session.tenantId,
            ...(session.role === 'USER' ? { requesterUserId: session.id } : {})
        },
        orderBy: { updatedAt: 'desc' },
        include: { relatedHelpTopic: true }
    });

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white">Taleplerim</h1>
                    <p className="text-gray-400 text-sm mt-1">Sormuş olduğunuz tüm destek taleplerinin durumu.</p>
                </div>
                <Link href="/support/new" className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2">
                    <span>+</span> Yeni Talep
                </Link>
            </div>

            <div className="bg-[#0f111a] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
                {tickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="text-4xl mb-4 block">🎧</span>
                        <h3 className="text-white font-bold text-lg">Henüz bir talebiniz yok</h3>
                        <p className="text-sm text-gray-500 mt-2">Yardıma ihityacınız olduğunda bize her zaman ulaşabilirsiniz.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Konu</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4">Öncelik</th>
                                    <th className="px-6 py-4">Son Güncelleme</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link href={`/support/${ticket.id}`} className="block">
                                                <div className="font-bold text-white group-hover:text-orange-400 transition-colors">
                                                    #{ticket.ticketNumber} - {ticket.subject}
                                                </div>
                                                {ticket.relatedHelpTopic && (
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <span>🔗</span> İlgili döküman: {ticket.relatedHelpTopic.title}
                                                    </div>
                                                )}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[ticket.status]}`}>
                                                {STATUS_LABELS[ticket.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {PRIORITY_LABELS[ticket.priority]}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                                            {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ticket.updatedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
