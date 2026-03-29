import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { ChevronLeft, Inbox, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

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

export default async function ReconciliationInboxPage() {
    const session = await getSession();
    if (!session) return notFound();

    const userEmail = session.user?.email || '';

    const counterparties = await prisma.reconciliationCounterparty.findMany({
        where: { email: userEmail },
        include: {
            reconciliation: {
                include: { customer: true, counterparties: true }
            }
        },
        orderBy: { reconciliation: { createdAt: 'desc' } }
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/reconciliation" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all shadow-sm shrink-0">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-[24px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                Gelen (Açık) Mutabakatlar
                            </h1>
                            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Diğer firmalardan size (veya firmanıza) gönderilen talepler
                            </p>
                        </div>
                    </div>
                </div>

                <SoftContainer title="Gelen Kutusu" icon={<Inbox className="w-4 h-4"/>}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">GÖNDEREN FİRMA & ZARF</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">DÖNEM / TÜR</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">TALEP EDİLEN BNET BAKİYE</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">SİZİN DURUMUNUZ</th>
                                    <th className="px-6 py-4 pr-8 font-bold text-right border-b border-slate-200 dark:border-white/5">AKSİYON</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {counterparties.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                            HENÜZ SİZE GELEN BİR MUTABAKAT TALEBİ YOK.
                                        </td>
                                    </tr>
                                ) : counterparties.map((cp: any) => {
                                    const recon = cp.reconciliation;
                                    const isPending = cp.status === 'PENDING' || cp.status === 'VIEWED';
                                    const isDisputed = cp.status === 'DISPUTED';
                                    const isOk = cp.status === 'APPROVED';

                                    return (
                                        <tr key={cp.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                            <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider mb-0.5">ZARF ID: {recon.id.substring(0,8).toUpperCase()}</div>
                                                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Gönderildi: {new Date(recon.createdAt).toLocaleDateString('tr-TR')}</div>
                                            </td>
                                            <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                <div className="text-[13px] font-bold text-slate-800 dark:text-white mb-0.5">{new Date(recon.periodEnd).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}</div>
                                                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{((recon.metaJson as any)?.type) || 'Mutabakat'}</div>
                                            </td>
                                            <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                <div className={`text-[14px] font-black ${Number(recon.balance) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {Math.abs(Number(recon.balance))} {recon.currency}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 mt-0.5 tracking-wider uppercase">
                                                    {Number(recon.balance) > 0 ? 'BORÇLU GÖRÜNÜYORSUNUZ' : 'ALACAKLI GÖRÜNÜYORSUNUZ'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                    isOk ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                                    isDisputed ? 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400' :
                                                    'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                                }`}>
                                                    {isOk ? <CheckCircle2 className="w-3 h-3"/> : isDisputed ? <AlertTriangle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                                    {cp.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 pr-8 align-middle text-right">
                                                <Link href={`/reconciliation/${recon.id}`} className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 w-max ml-auto">
                                                    YANITLA <ArrowRight className="w-3 h-3" />
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
