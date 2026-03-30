import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Filter, FileSignature, LayoutDashboard } from "lucide-react";

const SoftContainer = ({ title, icon, children, className="" }: any) => (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col ${className}`}>
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

export default async function SignatureEnvelopesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const { category } = await searchParams;

    const whereClause: any = { tenantId };
    if (category) {
        whereClause.documentCategory = category;
    }

    const envelopes = await prisma.signatureEnvelope.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { recipients: true }
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                {/* Enterprise Level 10 Unified Oval Navigation */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 relative z-10 w-full bg-white dark:bg-[#0f172a] p-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar">
                        {[
                            { path: '/signatures', label: 'İmza Panosu' },
                            { path: '/signatures/inbox', label: 'Gelen Talepler' },
                            { path: '/signatures/envelopes', label: 'Zarflar' },
                            { path: '/signatures/pending', label: 'Bekleyenler' },
                            { path: '/signatures/completed', label: 'Tamamlananlar' }
                        ].map(tab => {
                            const isActive = '/signatures/envelopes' === tab.path;
                            return (
                                <Link
                                    key={tab.path}
                                    href={tab.path}
                                    className={`h-[38px] flex flex-row items-center px-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'}`}
                                >
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </div>
                    <div>
                        <Link
                            href="/signatures/new"
                            className="h-[38px] px-6 flex flex-row items-center gap-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm whitespace-nowrap"
                        >
                            + YENİ ZARF
                        </Link>
                    </div>
                </div>
                </div>

                <SoftContainer title="Tüm Zarflar" icon={<FileSignature className="w-4 h-4"/>} className="min-h-[400px]">
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center shrink-0">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            <Filter className="w-4 h-4" /> Kategori Filtresi
                        </div>
                        <form method="GET" className="flex gap-3 m-0">
                            <select
                                name="category"
                                defaultValue={category || ''}
                                className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow">
                                <option value="">Tüm Kategoriler</option>
                                <option value="CONTRACT">Sözleşmeler (Contract)</option>
                                <option value="AGREEMENT">Anlaşmalar (Agreement)</option>
                                <option value="COMPANY_DOCUMENT">Şirket Evrakları</option>
                                <option value="EMPLOYEE_DOCUMENT">Özlük Evrakları</option>
                                <option value="FORM">Genel Formlar</option>
                            </select>
                            <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-[11px] font-black tracking-widest uppercase transition-colors">
                                Uygula
                            </button>
                        </form>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">TARİH</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">ZARF BAŞLIĞI</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">KATEGORİ</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">DURUM</th>
                                <th className="px-6 py-4 font-bold text-center border-b border-slate-200 dark:border-white/5">ALICI SAYISI</th>
                                <th className="px-6 py-4 pr-8 font-bold text-right border-b border-slate-200 dark:border-white/5">AKSİYONLAR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {envelopes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        HENÜZ ZARF OLUŞTURULMADI.
                                    </td>
                                </tr>
                            ) : envelopes.map((env: any) => (
                                <tr key={env.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[64px] group">
                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                        <div className="text-[12px] font-black text-slate-800 dark:text-white">{new Date(env.createdAt).toLocaleDateString('tr-TR')}</div>
                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{new Date(env.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <div className="text-[13px] font-black text-slate-800 dark:text-white truncate max-w-[300px]">{env.title}</div>
                                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono max-w-[300px] truncate">{env.documentFileName}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase border border-slate-200 dark:border-white/5 whitespace-nowrap">
                                            {env.documentCategory || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                            env.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                            env.status === 'REJECTED' || env.status === 'FAILED' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' :
                                            'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                        }`}>
                                            <div className={`w-1 h-1 rounded-full mr-1.5 ${
                                                env.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                env.status === 'REJECTED' || env.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'
                                            }`}></div>
                                            {env.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 align-middle text-center">
                                        <div className="text-[14px] font-black text-slate-800 dark:text-white leading-none">{env.recipients.length}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kişi</div>
                                    </td>
                                    <td className="px-6 py-3 pr-8 align-middle text-right">
                                        <Link href={`/signatures/envelopes/${env.id}`} className="px-4 py-2 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                                            Detay Gör
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </SoftContainer>
            </div>
        </div>
    );
}
