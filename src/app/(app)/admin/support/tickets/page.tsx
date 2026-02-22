import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
    title: 'Tüm Destek Talepleri - Admin',
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
    WAITING_CUSTOMER: 'Cevap Bekleniyor',
    RESOLVED: 'Çözümlü',
    CLOSED: 'Kapalı',
};

export default async function AdminTicketsPage({
    searchParams
}: {
    searchParams: { status?: string, tenantId?: string }
}) {
    const session = await getSession();
    // RBAC Control: Platform Admin or Support Agent
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        redirect('/login');
    }

    const tickets = await prisma.ticket.findMany({
        where: {
            ...(searchParams.status ? { status: searchParams.status as any } : {}),
            ...(searchParams.tenantId ? { tenantId: searchParams.tenantId } : {})
        },
        orderBy: { updatedAt: 'desc' },
        include: { relatedHelpTopic: true }
    });

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white">Destek Masası (Inbox)</h1>
                <p className="text-gray-400 text-sm mt-1">Sistemdeki tüm kiracılar tarafından oluşturulan destek talepleri.</p>
            </div>

            <div className="bg-[#0f111a] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Tenant / User</th>
                                <th className="px-6 py-4">Konu</th>
                                <th className="px-6 py-4">Kategori / Öncelik</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4">Son İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => (
                                <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-white mb-1">{ticket.tenantId}</div>
                                        <div className="text-xs text-gray-500">{ticket.requesterUserId}</div>
                                    </td>
                                    <td className="px-6 py-4 min-w-[250px]">
                                        <Link href={`/admin/support/tickets/${ticket.id}`} className="block">
                                            <div className="font-bold text-white group-hover:text-orange-400 transition-colors">
                                                #{ticket.ticketNumber} - {ticket.subject}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate max-w-sm">
                                                {ticket.description.substring(0, 80)}...
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="text-gray-300 font-medium mb-1">{ticket.category}</div>
                                        <div className="text-gray-500">{ticket.priority}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[ticket.status]}`}>
                                            {STATUS_LABELS[ticket.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(ticket.updatedAt).toLocaleString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                            {tickets.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Havuza düşen herhangi bir destek talebi bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
