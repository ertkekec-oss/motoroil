const fs = require('fs');

const code = `import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Inbox } from "lucide-react";

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

export default async function InboxSignaturesPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const userEmail = session.user?.email || '';

    const inboxItems = await prisma.signatureRecipient.findMany({
        where: {
            email: userEmail,
            envelope: { tenantId }
        },
        orderBy: { envelope: { createdAt: 'desc' } },
        include: { envelope: true }
    });

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/signatures" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all shrink-0">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-[24px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                                Bana Gelenler (Inbox)
                            </h1>
                            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                Onayınıza veya imzanıza sunulan aktif tüm belgeler
                            </p>
                        </div>
                    </div>
                </div>

                <SoftContainer title="Gelen Kutusu" icon={<Inbox className="w-4 h-4"/>} className="min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[10px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">GÖNDERİM TARİHİ</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">ZARF BAŞLIĞI</th>
                                <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/5">SİZİN DURUMUNUZ</th>
                                <th className="px-6 py-4 pr-8 font-bold text-right border-b border-slate-200 dark:border-white/5">AKSİYONLAR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {inboxItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        GELEN KUTUNUZDA ONAY BEKLEYEN İMZA YOK.
                                    </td>
                                </tr>
                            ) : inboxItems.map((r: any) => (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[64px] group">
                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                        <div className="text-[12px] font-black text-slate-800 dark:text-white">{new Date(r.envelope.createdAt).toLocaleDateString('tr-TR')}</div>
                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{new Date(r.envelope.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <div className="text-[13px] font-black text-slate-800 dark:text-white truncate max-w-[400px]">{r.envelope.title}</div>
                                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono truncate max-w-[400px]">{r.envelope.documentFileName}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <span className={\`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest \${
                                            r.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                            r.status === 'REJECTED' || r.status === 'FAILED' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' :
                                            'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400'
                                        }\`}>
                                            <div className={\`w-1 h-1 rounded-full mr-1.5 \${
                                                r.status === 'SIGNED' ? 'bg-emerald-500' :
                                                r.status === 'REJECTED' || r.status === 'FAILED' ? 'bg-red-500' : 'bg-orange-500'
                                            }\`}></div>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 pr-8 align-middle text-right">
                                        <Link href={\`/signatures/envelopes/\${r.envelope.id}\`} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                                            Zarfı Aç
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
`;

fs.writeFileSync('src/app/(app)/signatures/inbox/page.tsx', code);
console.log('done rewriting inbox');
