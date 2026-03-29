const fs = require('fs');

const code = `import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FileSignature, Inbox, Clock, CheckCircle2, ChevronRight, Activity, Eye, XCircle, PenTool, LayoutDashboard } from "lucide-react";

// ─── UI COMPONENTS ──────────────────────────────────────────────────
const TopPills = ({ pills }: any) => (
    <div className="flex flex-wrap items-center gap-4 shrink-0 mb-8 w-full">
        {pills.map((p: any, i: number) => (
            <Link href={p.route} key={i} className="flex flex-1 min-w-[240px] bg-white dark:bg-[#0f172a] rounded-[24px] pl-4 pr-6 py-4 items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md border border-slate-200 dark:border-white/5 shadow-sm group">
                <div className={\`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 \${p.bg} \${p.color} transition-colors\`}>
                    {p.icon}
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1">{p.title}</span>
                    <span className="text-[28px] font-black text-slate-800 dark:text-white leading-none">{p.value}</span>
                </div>
            </Link>
        ))}
    </div>
);

const SoftContainer = ({ title, icon, children, className="" }: any) => (
    <div className={\`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col \${className}\`}>
        {title && (
            <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest px-6 py-4 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20 flex items-center gap-2">
                {icon && <span className="opacity-70 text-slate-400">{icon}</span>}
                {title}
            </div>
        )}
        <div className="flex-1 overflow-auto w-full relative">
            {children}
        </div>
    </div>
);

export default async function SignaturesDashboardPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const userEmail = session.user?.email || '';

    // Calculate real stats
    const totalEnvelopes = await prisma.signatureEnvelope.count({ where: { tenantId } });
    const pendingEnvelopes = await prisma.signatureEnvelope.count({ where: { tenantId, status: { in: ['PENDING', 'IN_PROGRESS'] } } });
    const completedEnvelopes = await prisma.signatureEnvelope.count({ where: { tenantId, status: 'COMPLETED' } });
    const inboxCount = await prisma.signatureRecipient.count({
        where: {
            envelope: { tenantId },
            email: userEmail,
            status: { in: ['PENDING', 'VIEWED'] }
        }
    });

    const recentEvents = await prisma.signatureAuditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { envelope: true }
    });

    const getActionProps = (action: string) => {
        if (action.includes('VIEWED')) return { icon: <Eye className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" };
        if (action.includes('SIGNED')) return { icon: <PenTool className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" };
        if (action.includes('REJECTED')) return { icon: <XCircle className="w-4 h-4" />, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" };
        if (action.includes('COMPLETED')) return { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20" };
        return { icon: <Activity className="w-4 h-4" />, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" };
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-[24px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                İmza Panosu
                            </h1>
                            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Tüm dijital sözleşme ve mutabakat imza süreçleri
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/signatures/envelopes" className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
                            Zarflara Git
                        </Link>
                        <Link href="/signatures/new" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 dark:border-blue-500/50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm shadow-blue-500/20">
                            + YENİ ZARF GÖNDER
                        </Link>
                    </div>
                </div>

                <TopPills pills={[
                    { title: 'Tümü', route: '/signatures/envelopes', value: totalEnvelopes, icon: <FileSignature className="w-6 h-6"/>, bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500' },
                    { title: 'Bana Gelenler', route: '/signatures/inbox', value: inboxCount, icon: <Inbox className="w-6 h-6"/>, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500' },
                    { title: 'Bekleyenler (Zarflar)', route: '/signatures/pending', value: pendingEnvelopes, icon: <Clock className="w-6 h-6"/>, bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500' },
                    { title: 'Tamamlananlar', route: '/signatures/completed', value: completedEnvelopes, icon: <CheckCircle2 className="w-6 h-6"/>, bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-500' }
                ]} />

                <SoftContainer title="Son Sistem Hareketleri" icon={<Activity className="w-4 h-4"/>} className="min-h-[400px]">
                    {recentEvents.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center flex-col text-slate-400 gap-3 text-center py-20">
                            <Activity className="w-10 h-10 opacity-30 mb-2" />
                            <h4 className="text-[12px] font-black uppercase tracking-widest leading-none">HENÜZ SİSTEM HAREKETİ BULUNMUYOR</h4>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">AKSİYON / DURUM</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">ZARF / BELGE BİLGİSİ</th>
                                    <th className="px-6 py-4 pr-8 font-bold text-right border-b border-slate-200 dark:border-white/5">TARİH</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {recentEvents.map(a => {
                                    const props = getActionProps(a.action);
                                    return (
                                        <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[68px] group">
                                            <td className="px-6 py-3 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className={\`w-8 h-8 rounded-full flex items-center justify-center border \${props.bg} \${props.color} shrink-0\`}>
                                                        {props.icon}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{a.action.replace(/_/g, ' ')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 align-middle">
                                                <div className="flex flex-col gap-1 max-w-[400px]">
                                                    <Link href={\`/signatures/envelopes/\${a.envelopeId}\`} className="text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline truncate">
                                                        {a.envelope.title}
                                                    </Link>
                                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono truncate">
                                                        Belge: {a.envelope.documentFileName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 pr-8 align-middle text-right">
                                                <div className="flex flex-col items-end gap-1 text-slate-500 dark:text-slate-400">
                                                    <span className="text-[12px] font-black text-slate-800 dark:text-white">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(a.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </SoftContainer>
            </div>
        </div>
    );
}
`;

fs.writeFileSync('src/app/(app)/signatures/page.tsx', code);
console.log('done rewriting signatures/page.tsx');
