const fs = require('fs');

const code = `import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { Network, Activity, FileCheck2, Clock, CheckCircle2, AlertTriangle, Layers, Zap } from "lucide-react";

const TopPills = ({ pills }: any) => (
    <div className="flex flex-wrap items-center gap-4 shrink-0 mb-8 w-full">
        {pills.map((p: any, i: number) => (
            <Link href={p.route} key={i} className="flex flex-1 min-w-[200px] bg-white dark:bg-[#0f172a] rounded-[24px] pl-4 pr-6 py-4 items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md border border-slate-200 dark:border-white/5 shadow-sm group">
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
            <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest px-6 py-4 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20 flex items-center gap-2 relative">
                {icon && <span className="opacity-70 text-slate-400">{icon}</span>}
                {title}
            </div>
        )}
        <div className="flex-1 w-full relative">
            {children}
        </div>
    </div>
);

export default async function ReconciliationDashboardPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;

    const stats = await prisma.reconciliation.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true }
    });

    const statusMap = stats.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr._count._all;
        return acc;
    }, {});

    const totalCount = stats.reduce((sum: number, curr: any) => sum + curr._count._all, 0);
    const pendingCount = (statusMap['SENT'] || 0) + (statusMap['VIEWED'] || 0) + (statusMap['SIGNING'] || 0);
    const approvedCount = statusMap['SIGNED'] || 0;
    const disputedCount = statusMap['DISPUTED'] || 0;

    const latestAudits = await prisma.reconciliationAuditEvent.findMany({
        where: { reconciliation: { tenantId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { reconciliation: { select: { id: true, accountId: true } } }
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <Network className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-[24px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                Mutabakat Panosu
                            </h1>
                            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Cari ağınızla olan güncel mutabakat özetleri
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/reconciliation/list" className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
                            Tüm Listeyi Gör
                        </Link>
                        <Link href="/reconciliation/new" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 dark:border-blue-500/50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm shadow-blue-500/20">
                            + YENİ OLUŞTUR
                        </Link>
                    </div>
                </div>

                <TopPills pills={[
                    { title: 'Toplam Mutabakat', route: '/reconciliation/list', value: totalCount, icon: <Layers className="w-6 h-6"/>, bg: 'bg-indigo-50 dark:bg-indigo-500/10', color: 'text-indigo-500' },
                    { title: 'Cevap Bekleyen', route: '/reconciliation/inbox', value: pendingCount, icon: <Clock className="w-6 h-6"/>, bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500' },
                    { title: 'Onaylanan', route: '/reconciliation/list', value: approvedCount, icon: <CheckCircle2 className="w-6 h-6"/>, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500' },
                    { title: 'İtirazlı (Dispute)', route: '/reconciliation/disputes', value: disputedCount, icon: <AlertTriangle className="w-6 h-6"/>, bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500' }
                ]} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="col-span-1 lg:col-span-2 flex flex-col">
                        <SoftContainer title="Aksiyon & Dikkat Merkezi" icon={<Zap className="w-4 h-4"/>} className="h-full">
                            <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400 gap-4 border-2 border-dashed border-slate-100 dark:border-white/5 m-6 rounded-2xl bg-slate-50/50 dark:bg-[#0f172a]">
                                <FileCheck2 className="w-12 h-12 opacity-30 text-emerald-500" />
                                <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Tümü Gözden Geçirildi</h3>
                                <p className="text-[11px] font-medium text-slate-500" style={{ margin: 0 }}>Şu an için itirazlı veya süresi dolmak üzere olan acil mutabakatınız bulunmuyor.</p>
                            </div>
                        </SoftContainer>
                    </div>

                    <div className="col-span-1 flex flex-col">
                        <SoftContainer title="Son Sistem Hareketleri" icon={<Activity className="w-4 h-4"/>} className="h-full min-h-[400px]">
                            {latestAudits.length === 0 ? (
                                <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Sistemde henüz hareket yok.
                                </div>
                            ) : (
                                <div className="p-6 relative">
                                    <div className="absolute top-10 bottom-10 left-[41px] w-[2px] bg-slate-100 dark:bg-white/5 rounded-full z-0"></div>
                                    <div className="flex flex-col gap-6 relative z-10 w-full">
                                        {latestAudits.map((a: any) => {
                                            const isGood = a.action.includes('SIGNED') || a.action.includes('COMPLETED') || a.action.includes('VERIFIED');
                                            const isBad = a.action.includes('REJECTED') || a.action.includes('DISPUTED');
                                            return (
                                                <div key={a.id} className="flex gap-4">
                                                    <div className={\`w-8 h-8 rounded-full border-2 border-white dark:border-[#0f172a] flex items-center justify-center shrink-0 shadow-sm \${
                                                        isGood ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500' :
                                                        isBad ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-500' :
                                                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                    }\`}>
                                                        {isGood ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                                                         isBad ? <AlertTriangle className="w-3.5 h-3.5" /> : 
                                                         <Activity className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div className="flex flex-col flex-1 pt-1">
                                                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 leading-tight">
                                                            {a.action.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3"/> {new Date(a.createdAt).toLocaleString()}
                                                        </div>
                                                        <div className="mt-1 text-[9px] text-slate-400 font-mono tracking-widest uppercase truncate max-w-[200px]">
                                                            ID: {a.reconciliationId?.substring(0,8)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </SoftContainer>
                    </div>

                </div>
            </div>
        </div>
    );
}
`;

fs.writeFileSync('src/app/(app)/reconciliation/page.tsx', code);
console.log('done rewriting reconciliation/page.tsx');
