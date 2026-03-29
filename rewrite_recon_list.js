const fs = require('fs');

const code = `import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { ChevronLeft, Filter, Layers, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

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

export default async function ReconciliationListPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const { category } = await searchParams;

    const whereClause: any = { tenantId };

    const recons = await prisma.reconciliation.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: {
            customer: { select: { name: true, phone: true } },
            items: true
        }
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
                                Tüm Mutabakatlar (Liste)
                            </h1>
                            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Firmalara gönderilen tüm mutabakatların güncel durumu
                            </p>
                        </div>
                    </div>
                    <div>
                        <Link href="/reconciliation/new" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 dark:border-blue-500/50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2">
                            + YENİ OLUŞTUR
                        </Link>
                    </div>
                </div>

                <SoftContainer title="Mutabakat Kayıtları" icon={<Layers className="w-4 h-4"/>}>
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row gap-4 justify-between md:items-center shrink-0">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            <Filter className="w-4 h-4" /> Kategori & Durum
                        </div>
                        <form method="GET" className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select className="flex-1 md:w-auto px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 text-[12px] font-semibold outline-none focus:border-blue-500 transition-shadow appearance-none">
                                <option value="">Tüm Kategoriler</option>
                                <option value="RECONCILIATION">Mutabakatlar</option>
                                <option value="CONTRACT">Sözleşmeler</option>
                            </select>
                            <select className="flex-1 md:w-auto px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 text-[12px] font-semibold outline-none focus:border-blue-500 transition-shadow appearance-none">
                                <option>Tüm Durumlar</option>
                                <option>Bekleyenler (SENT/VIEWED)</option>
                                <option>Onaylananlar (SIGNED)</option>
                                <option>İtiraz Edilenler (DISPUTED)</option>
                            </select>
                            <input type="text" placeholder="Firma Adı veya ID..." className="flex-1 md:w-64 px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 text-[12px] font-semibold outline-none focus:border-blue-500 transition-shadow disabled:opacity-50" />
                            <button className="px-6 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest transition-all">
                                UYGULA
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">DÖNEM / TÜR</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">FİRMA (CARİ HESAP)</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">DURUM</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">SON İŞLEM</th>
                                    <th className="px-6 py-4 pr-8 font-bold text-right border-b border-slate-200 dark:border-white/5">AKSİYON</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {recons.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                            HENÜZ MUTABAKAT KAYDI BULUNAMADI.
                                        </td>
                                    </tr>
                                ) : recons.map((recon: any) => {
                                    const isDisputed = recon.status === 'DISPUTED';
                                    const isOk = recon.status === 'SIGNED' || recon.status === 'COMPLETED';
                                    const isPending = recon.status === 'SENT' || recon.status === 'VIEWED' || recon.status === 'SIGNING';

                                    return (
                                        <tr key={recon.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group">
                                            <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-wider">{new Date(recon.periodEnd).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}</div>
                                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">{(recon.metaJson as any)?.type || 'Mutabakat'}</div>
                                            </td>
                                            <td className="px-6 py-3 align-middle">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-white truncate max-w-[300px]">{recon.customer ? recon.customer.name : 'Silinmiş Hesap'}</div>
                                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono tracking-wider mt-0.5">ID: {recon.id.substring(0,8).toUpperCase()}</div>
                                            </td>
                                            <td className="px-6 py-3 align-middle">
                                                <div className={\`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest \${
                                                    isOk ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                                    isDisputed ? 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400' :
                                                    isPending ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' :
                                                    'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                                }\`}>
                                                    {isOk ? <CheckCircle2 className="w-3 h-3"/> : isDisputed ? <AlertTriangle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                                    {recon.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 align-middle whitespace-nowrap text-[11px] font-bold tracking-widest text-slate-500">
                                                {new Date(recon.updatedAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-3 pr-8 align-middle text-right">
                                                <Link href={\`/reconciliation/\${recon.id}\`} className="px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                                                    Detaylar
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
`;

fs.writeFileSync('src/app/(app)/reconciliation/list/page.tsx', code);
console.log('done rewriting recon list');
