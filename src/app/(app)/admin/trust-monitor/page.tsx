import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export default async function TrustMonitorPage() {
    const session = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "PLATFORM_ADMIN")) {
        return redirect("/login");
    }

    const trustProfiles = await prisma.companyTrustProfile.findMany({
        orderBy: { overallScore: 'desc' },
        take: 50
    });

    const tenantIds = trustProfiles.map(p => p.tenantId);
    const companies = await prisma.company.findMany({
        where: { tenantId: { in: tenantIds } },
        select: { id: true, name: true, tenantId: true }
    });

    const companyMap = new Map();
    companies.forEach(c => companyMap.set(c.tenantId, c.name));

    return (
        <EnterprisePageShell 
            title="Güven Monitörü (Trust Monitor)" 
            description="Platformdaki tüm firmaların Network İtibar skorları ve algoritmik değerlendirmeleri."
        >
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Global Firma Trust Skorları</h2>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Ağdaki firma güven profillerinin risk analizi dağılımları.</p>
                        </div>
                    </div>

                    <div className="p-0">
                        {trustProfiles.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                                    🔍
                                </div>
                                <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Henüz Analiz Yok</p>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-sm mx-auto uppercase tracking-widest">Sistemde oluşan yeterli trust verisi (TrustProfile) bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Firma / Üye Müşteri</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">Güven Seviyesi (Tier)</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">Genel Skor</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">Kimlik & Finans</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">Ticaret İtibarı</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">Lojistik Bağlılığı</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">İtiraz & Uyuşmazlık</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-right">Son Değerlendirme</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {trustProfiles.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-6 py-4 font-black text-[12px] text-slate-900 dark:text-white uppercase tracking-wider">
                                                    {companyMap.get(p.tenantId) || p.tenantId}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border ${p.trustLevel === 'A' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                                                            p.trustLevel === 'B' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' :
                                                                p.trustLevel === 'C' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                                                                    'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/30'
                                                        }`}>
                                                        Tier {p.trustLevel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-mono text-[13px] font-black text-slate-900 dark:text-white border border-slate-200 dark:border-white/10">
                                                        {p.overallScore}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-[12px] font-bold text-slate-600 dark:text-slate-400">{p.identityScore}</td>
                                                <td className="px-6 py-4 text-center font-mono text-[12px] font-bold text-slate-600 dark:text-slate-400">{p.tradeScore}</td>
                                                <td className="px-6 py-4 text-center font-mono text-[12px] font-bold text-slate-600 dark:text-slate-400">{p.shippingScore}</td>
                                                <td className="px-6 py-4 text-center font-mono text-[12px] font-bold text-slate-600 dark:text-slate-400">{p.disputeScore}</td>
                                                <td className="px-6 py-4 text-right text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                                    {p.lastCalculatedAt ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(new Date(p.lastCalculatedAt)) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
        </EnterprisePageShell>
    );
}
