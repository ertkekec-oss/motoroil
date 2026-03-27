import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function TradeLedgerPage() {
    const ledgerEntries = await prisma.tradeLedgerEntry.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 100
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans w-full pb-16 focus:outline-none">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <span className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg">📜</span>
                            Birleşik Ticaret Defteri (Unified Ledger)
                        </h1>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 ml-14">
                            Tüm ağ içi ticari olayların, eşleşmelerin ve tekliflerin değiştirilemez, salt eklenir (append-only) geçmişi.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Son Ağ Defteri Kayıtları</h2>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Sistemdeki son 100 işlem günlüğü ve olay izleri.</p>
                        </div>
                    </div>
                    
                    <div className="p-0">
                        {ledgerEntries.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                                    📭
                                </div>
                                <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Kayıt Bulunamadı</p>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-sm mx-auto uppercase tracking-widest">Birleşik ticaret defterinde henüz listelenecek bir işlem yok.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Gerçekleşme Zamanı</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Olay Tipi</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Alıcı Tenant</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Satıcı Tenant</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Ürün ID</th>
                                            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Referans</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {ledgerEntries?.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest">
                                                    {new Date(entry.occurredAt).toLocaleString('tr-TR')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 uppercase border border-blue-200 dark:border-blue-500/30">
                                                        {entry.eventType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">{entry.buyerTenantId || '-'}</td>
                                                <td className="px-6 py-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">{entry.sellerTenantId || '-'}</td>
                                                <td className="px-6 py-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">{entry.canonicalProductId || entry.productId || '-'}</td>
                                                <td className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                                                    {entry.proposalId || entry.opportunityId || entry.contractId || entry.sourceRef || '-'}
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
