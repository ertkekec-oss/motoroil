import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
    title: 'Tüm Destek Talepleri - Admin',
};

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    WAITING_CUSTOMER: 'bg-purple-50 text-purple-700 border-purple-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-50 text-slate-700 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
    NEW: 'Yeni',
    IN_PROGRESS: 'İşlemde',
    WAITING_CUSTOMER: 'Yanıt Bekliyor',
    RESOLVED: 'Çözümlü',
    CLOSED: 'Kapalı',
};

const PRIORITY_STYLES: Record<string, string> = {
    P1_URGENT: 'text-rose-600 font-bold',
    P2_HIGH: 'text-orange-600 font-semibold',
    P3_NORMAL: 'text-slate-500',
    P4_LOW: 'text-slate-400',
};

export default async function AdminTicketsPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string, tenantId?: string, assignedTo?: string }>
}) {
    const { status, tenantId, assignedTo } = await searchParams;
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        redirect('/login');
    }

    const tickets = await prisma.ticket.findMany({
        where: {
            ...(status ? { status: status as any } : {}),
            ...(tenantId ? { tenantId: tenantId } : {}),
            ...(assignedTo ? { assignedToUserId: assignedTo === 'none' ? null : assignedTo } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        include: {
            relatedHelpTopic: true,
        }
    });

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Destek Masası (Inbox)</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-slate-500 text-sm">Sistemdeki tüm kiracılar tarafından oluşturulan destek talepleri.</p>
                            <Link href="/admin/tenants/PLATFORM_ADMIN/help" className="text-orange-600 font-bold text-xs bg-orange-100 border border-orange-200 px-3 py-1 rounded-full hover:bg-orange-200 transition-all">
                                📚 Bilgi Bankasını Yönet
                            </Link>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/support/tickets" className="px-3 py-1.5 text-xs bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">Hepsi</Link>
                        <Link href="/admin/support/tickets?status=NEW" className="px-3 py-1.5 text-xs bg-blue-50 border border-blue-100 text-blue-700 rounded-lg whitespace-nowrap hover:bg-blue-100">Yeni Gelenler</Link>
                        <Link href="/admin/support/tickets?status=WAITING_CUSTOMER" className="px-3 py-1.5 text-xs bg-purple-50 border border-purple-100 text-purple-700 rounded-lg whitespace-nowrap hover:bg-purple-100">Cevap Bekleyenler</Link>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                    <th className="px-6 py-4">Tenant / User</th>
                                    <th className="px-6 py-4">Konu / Açıklama</th>
                                    <th className="px-6 py-4">Kategori / Öncelik</th>
                                    <th className="px-6 py-4">Atanan Staff</th>
                                    <th className="px-6 py-4 text-center">Durum</th>
                                    <th className="px-6 py-4 text-right">Son Güncelleme</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-900 mb-1">{ticket.tenantId}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{ticket.requesterUserId}</div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[300px]">
                                            <Link href={`/admin/support/tickets/${ticket.id}`} className="block">
                                                <div className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors mb-1">
                                                    #{ticket.ticketNumber} - {ticket.subject}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate max-w-md">
                                                    {ticket.description}
                                                </p>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-700 font-medium mb-1">{ticket.category}</div>
                                            <div className={`text-[10px] ${PRIORITY_STYLES[ticket.priority] || 'text-slate-400'}`}>
                                                {ticket.priority.replace('P', 'Önem ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {ticket.assignedToUserId ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[8px] text-white">S</span>
                                                    <span className="text-xs text-orange-400 font-medium">{ticket.assignedToUserId.substring(0, 10)}...</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600 italic">Atanmamış</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${STATUS_COLORS[ticket.status]}`}>
                                                {STATUS_LABELS[ticket.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-mono">
                                            {new Date(ticket.updatedAt).toLocaleString('tr-TR')}
                                        </td>
                                    </tr>
                                ))}
                                {tickets.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="text-3xl mb-4">📭</div>
                                            <div className="text-gray-400 font-bold">Harika! Hiç bekleyen talep yok.</div>
                                            <div className="text-gray-600 text-xs mt-1">Yeni bir talep geldiğinde burada görünecektir.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center text-xs text-gray-500">
                    <div>Toplam {tickets.length} talep listeleniyor</div>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Yeni</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> İşlemde</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Beklemede</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
