import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PlatformFinancePage() {
    const session = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "PLATFORM_ADMIN")) {
        return redirect("/login");
    }

    // Platform-wide Statistics
    const companyCount = await prisma.company.count({ where: { deletedAt: null } });
    const userCount = await prisma.user.count({ where: { deletedAt: null } });

    // Total Escrow Locked / Processed approximations (sum of active Escrows and TradeLedger values if they exist, or just rough stats)
    const activeEscrows = await prisma.tradeEscrow.count({ where: { status: 'LOCKED' } });
    const completedTrades = await prisma.tradeLedger.count();

    // Let's also fetch recent ledger entries
    const recentLedgers = await prisma.tradeLedger.findMany({
        take: 10,
        orderBy: { recordedAt: 'desc' },
        select: {
            id: true,
            proposalId: true,
            status: true,
            recordedAt: true,
            metaJson: true
        }
    });

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">Platform Finans & B2B Gelir Tablosu</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Tüm ağın (Network) toplam dönen hacmi, komisyonlar ve aktif Emanet (Escrow) büyüklüğü.</p>
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            Global Görünüm (SUPER_ADMIN)
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ağdaki Şirketler</h3>
                            <span className="text-2xl">🏢</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{companyCount}</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Toplam Kayıtlı Acenta/Tedarikçi</p>
                    </div>

                    <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Kilitli Escrow (Aktif)</h3>
                            <span className="text-2xl">🔒</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeEscrows}</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Teslimat onayı bekleyen işlem</p>
                    </div>

                    <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Gerçekleşen İşlem (UTL)</h3>
                            <span className="text-2xl">🔗</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{completedTrades}</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Ledger üzerine yazılmış başarılı ticaret</p>
                    </div>

                    <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform Komisyon Tahmini</h3>
                            <span className="text-2xl">📈</span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">% 0.5 - 1.2</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Dinamik İşlem Ücreti Baremi</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Gerçek Zamanlı Network İşlemleri (Trade Ledger)</h3>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Son tamamlanan blok ticaretlerinin ham platform kayıtları.</p>
                        </div>
                    </div>

                    <div className="p-0">
                        {recentLedgers.length === 0 ? (
                            <div className="p-16 text-center">
                                <span className="text-4xl text-slate-400">⛓️</span>
                                <h3 className="font-semibold text-slate-900 dark:text-white mt-4">Henüz İşlem Yok</h3>
                                <p className="text-slate-500 text-sm mt-2">Platform üzerinde onaylanıp Ledger'a yazılmış bir B2B ticareti bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Tarih</th>
                                            <th className="px-6 py-4">Ledger ID / Hash</th>
                                            <th className="px-6 py-4">Teklif (Proposal)</th>
                                            <th className="px-6 py-4 text-center">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {recentLedgers.map(l => (
                                            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(l.recordedAt))}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{l.id.substring(0, 16)}...</td>
                                                <td className="px-6 py-4">{(l.metaJson as any)?.type || l.proposalId || 'B2B Trade'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        {l.status}
                                                    </span>
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
