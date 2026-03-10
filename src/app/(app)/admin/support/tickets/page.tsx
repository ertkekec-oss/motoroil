import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { LifeBuoy, AlertCircle, Clock, CheckCircle, MessageSquare, Plus, Activity } from 'lucide-react';

export const metadata = {
    title: 'Tüm Destek Talepleri - Admin',
};

const STATUS_COLORS: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    WAITING_USER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
    RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    CLOSED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
};

const STATUS_LABELS: Record<string, string> = {
    OPEN: 'Yeni',
    IN_PROGRESS: 'İşlemde',
    WAITING_USER: 'Müşteri Bekleniyor',
    RESOLVED: 'Çözümlü',
    CLOSED: 'Kapalı',
};

const PRIORITY_STYLES: Record<string, string> = {
    CRITICAL: 'text-rose-600 dark:text-rose-400 font-bold',
    HIGH: 'text-orange-600 dark:text-orange-400 font-semibold',
    NORMAL: 'text-slate-500 dark:text-slate-400',
    LOW: 'text-slate-400 dark:text-slate-500',
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

    const tickets = await prisma.supportTicket.findMany({
        where: {
            ...(status ? { status: status as any } : {}),
            ...(tenantId ? { tenantId: tenantId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
            comments: {
                take: 1,
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    const metrics = {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        waiting: tickets.filter(t => t.status === 'WAITING_USER').length,
        resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length
    };

    return (
        <EnterprisePageShell
            title="Destek Masası (Inbox)"
            description="Sistemdeki tüm kiracılar tarafından oluşturulan kurumsal destek talepleri."
            actions={
                <Link href="/admin/tenants/PLATFORM_ADMIN/help" className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4" /> Bilgi Bankasını Yönet
                </Link>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <EnterpriseCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{metrics.new}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Yeni Talep</div>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{metrics.inProgress}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">İşlemde</div>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{metrics.waiting}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Yanıt Bekleyen</div>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{metrics.resolved}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Çözümlendi</div>
                    </div>
                </EnterpriseCard>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                    {[
                        { 
                            group: 'GENEL', 
                            items: [
                                { id: '', label: `Hepsi (${metrics.total})` },
                                { id: 'OPEN', label: 'Yeni Gelenler' }
                            ] 
                        },
                        { 
                            group: 'SÜREÇ', 
                            items: [
                                { id: 'IN_PROGRESS', label: 'İşlemde Olanlar' }, 
                                { id: 'WAITING_USER', label: 'Yanıt Bekleyenler' },
                                { id: 'RESOLVED', label: 'Çözümlenenler' }
                            ] 
                        },
                    ].map((grp, i) => (
                        <div key={grp.group} className="flex items-center gap-3">
                            {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                {grp.items.map(tab => {
                                    const isActive = status === tab.id || (!status && tab.id === '');
                                    return (
                                        <Link
                                            key={tab.id}
                                            href={tab.id ? `/admin/support/tickets?status=${tab.id}` : '/admin/support/tickets'}
                                            className={isActive
                                                ? "px-3 py-1.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px] transition-all"
                                                : "px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"}
                                        >
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <EnterpriseCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="px-6 py-4">Müşteri (Tenant)</th>
                                <th className="px-6 py-4">Konu Özeti</th>
                                <th className="px-6 py-4">Kategori & Öncelik</th>
                                <th className="px-6 py-4 text-center">Durum</th>
                                <th className="px-6 py-4 text-right">Oluşturulma</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {tickets?.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{ticket.tenantId}</div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-tighter">
                                            {ticket.createdByUserId?.substring(0, 10) || 'SYSTEM'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 min-w-[300px] max-w-md">
                                        <Link href={`/admin/support/${ticket.id}`} className="block">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 truncate">
                                                #{ticket.id.substring(ticket.id.length - 6).toUpperCase()} - {ticket.subject}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {ticket.description ? ticket.description.substring(0, 80) : "Detay bulunamadı."}
                                            </p>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-900 dark:text-slate-200 font-medium mb-1">{ticket.category.replace('_', ' ')}</div>
                                        <div className={`text-[10px] uppercase tracking-wider ${PRIORITY_STYLES[ticket.priority] || 'text-slate-400'}`}>
                                            {ticket.priority}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN}`}>
                                            {STATUS_LABELS[ticket.status] || ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm text-slate-900 dark:text-slate-200 font-medium">
                                            {new Date(ticket.createdAt).toISOString().substring(0, 10).split('-').reverse().join('.')}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                                            {new Date(ticket.createdAt).toISOString().substring(11, 16)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {tickets.length === 0 && (
                        <div className="p-12">
                            <EnterpriseEmptyState
                                title="Bekleyen Destek Talebi Yok"
                                description="Seçili filtreye uygun veya gelen herhangi bir destek talebi bulunmuyor."
                                icon="Inbox"
                            />
                        </div>
                    )}
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
