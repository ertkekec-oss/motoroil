import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { ChevronLeft, Filter, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

const SoftContainer = ({ title, icon, children, className="" }: any) => (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col ${className}`}>
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

export default async function ReconciliationDisputesPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;

    const disputes = await prisma.reconciliationDispute.findMany({
        where: { reconciliation: { tenantId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            reconciliation: {
                include: { account: true }
            }
        }
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/reconciliation" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all shadow-sm shrink-0">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-[24px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                            İtiraz Yönetimi (Disputes)
                        </h1>
                        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Cari ağınız tarafından red ve itiraz edilen BABS / Mutabakat kayıtları
                        </p>
                    </div>
                </div>

                <SoftContainer title="Açık Uyuşmazlık Kayıtları" icon={<ShieldAlert className="w-4 h-4 text-orange-500"/>} className="border-orange-200 dark:border-orange-500/30">
                    <div className="px-6 py-4 bg-orange-50/50 dark:bg-orange-500/5 border-b border-orange-100 dark:border-orange-500/10 flex flex-col md:flex-row gap-4 justify-between md:items-center shrink-0">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest whitespace-nowrap">
                            <Filter className="w-4 h-4" /> Durum Filtresi
                        </div>
                        <form method="GET" className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select className="flex-1 md:w-auto px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 text-[12px] font-semibold outline-none focus:border-orange-500 transition-shadow appearance-none">
                                <option>Açık (İncelenecekler)</option>
                                <option>Çözülenler</option>
                                <option>Tümü</option>
                            </select>
                            <button className="px-6 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
                                UYGULA
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-bold border-b border-orange-100 dark:border-orange-500/10">FİRMA & ZARF ID</th>
                                    <th className="px-6 py-4 font-bold border-b border-orange-100 dark:border-orange-500/10">TARİH</th>
                                    <th className="px-6 py-4 font-bold border-b border-orange-100 dark:border-orange-500/10">İTİRAZ NEDENİ / NOT GEREKÇESİ</th>
                                    <th className="px-6 py-4 font-bold border-b border-orange-100 dark:border-orange-500/10">DURUM</th>
                                    <th className="px-6 py-4 pr-8 font-bold text-right border-b border-orange-100 dark:border-orange-500/10">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {disputes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                                            HARİKA! HİÇ MUTABAKAT UYUŞMAZLIĞI (İTİRAZ) BULUNMUYOR.
                                        </td>
                                    </tr>
                                ) : disputes.map((d: any) => {
                                    const isOpen = d.status === 'OPEN' || d.status === 'UNDER_REVIEW';

                                    return (
                                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors group">
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-white max-w-[250px] leading-tight mb-1">
                                                    {d.reconciliation.account?.name || 'Bilinmiyor'}
                                                </div>
                                                <div className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 tracking-wider">
                                                    ZARF: {d.reconciliationId.substring(0, 8).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top whitespace-nowrap">
                                                <div className="text-[12px] font-bold text-slate-500">{new Date(d.createdAt).toLocaleDateString('tr-TR')}</div>
                                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(d.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">
                                                    {d.reason.replace(/_/g, ' ')}
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 inline-block">
                                                    "{d.customerNote ? d.customerNote : 'Özel bir not düşülmemiş.'}"
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top whitespace-nowrap">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                    isOpen ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                                }`}>
                                                    {isOpen ? <AlertTriangle className="w-3 h-3"/> : <CheckCircle2 className="w-3 h-3"/>}
                                                    {d.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 pr-8 align-top text-right">
                                                <Link href={`/reconciliation/${d.reconciliationId}`} className="px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                                                    İncele
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </SoftContainer>
            </div>
        </div>
    );
}
