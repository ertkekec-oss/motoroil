import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TrustMonitorPage() {
    const session = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "PLATFORM_ADMIN")) {
        return redirect("/login");
    }

    // Fetch all trust profiles with associated company basic info (if matching by tenantId)
    // Actually we can just fetch company and include trust profile if relation exists, but company schema might not have it directly. 
    // We'll fetch profiles and then companies to map them safely, or just show tenantId if company not mapped.
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
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">🧠 Trust Monitor (Güven Monitörü)</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Platformdaki tüm firmaların Network İtibar skorları ve algoritmik değerlendirmeleri.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/50">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Global Firma Trust Skorları</h3>
                    </div>

                    <div className="p-0">
                        {trustProfiles.length === 0 ? (
                            <div className="p-16 text-center">
                                <span className="text-4xl text-slate-400">🔍</span>
                                <h3 className="font-semibold text-slate-900 dark:text-white mt-4">Henüz Analiz Yok</h3>
                                <p className="text-slate-500 text-sm mt-2">Sistemde oluşan yeterli trust verisi (TrustProfile) bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Firma / Üye Müşteri</th>
                                            <th className="px-6 py-4 text-center">Trust Level</th>
                                            <th className="px-6 py-4 text-center">Overall Score</th>
                                            <th className="px-6 py-4 text-center">Identity</th>
                                            <th className="px-6 py-4 text-center">Trade</th>
                                            <th className="px-6 py-4 text-center">Shipping</th>
                                            <th className="px-6 py-4 text-center">Dispute</th>
                                            <th className="px-6 py-4 text-right">Son Hesaplama</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {trustProfiles.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {companyMap.get(p.tenantId) || p.tenantId}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${p.trustLevel === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                                            p.trustLevel === 'B' ? 'bg-blue-100 text-blue-800' :
                                                                p.trustLevel === 'C' ? 'bg-amber-100 text-amber-800' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}>
                                                        {p.trustLevel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-800">{p.overallScore}</td>
                                                <td className="px-6 py-4 text-center">{p.identityScore}</td>
                                                <td className="px-6 py-4 text-center">{p.tradeScore}</td>
                                                <td className="px-6 py-4 text-center">{p.shippingScore}</td>
                                                <td className="px-6 py-4 text-center">{p.disputeScore}</td>
                                                <td className="px-6 py-4 text-right">
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
            </div>
        </div>
    );
}
