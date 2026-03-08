import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function TradeLedgerPage() {
    const ledgerEntries = await prisma.tradeLedgerEntry.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 100
    });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b pb-4">Unified Trade Ledger</h1>
                <p className="text-slate-500 mt-2">
                    Immutable, append-only history of all network commercial events, matching, and proposals.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Recent Network Ledger Entries</h2>
                </div>
                <div className="p-0">
                    {ledgerEntries.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-sm">
                            No entries found in the Unified Trade Ledger.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="px-6 py-3">Occurred At</th>
                                        <th className="px-6 py-3">Event Type</th>
                                        <th className="px-6 py-3">Buyer Tenant</th>
                                        <th className="px-6 py-3">Seller Tenant</th>
                                        <th className="px-6 py-3">Product</th>
                                        <th className="px-6 py-3">Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ledgerEntries?.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900">
                                                {new Date(entry.occurredAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex py-0.5 px-2.5 rounded-full border border-slate-200 text-xs text-slate-700 bg-white shadow-sm font-medium">{entry.eventType}</span>
                                            </td>
                                            <td className="px-6 py-4">{entry.buyerTenantId || '-'}</td>
                                            <td className="px-6 py-4">{entry.sellerTenantId || '-'}</td>
                                            <td className="px-6 py-4">{entry.canonicalProductId || entry.productId || '-'}</td>
                                            <td className="px-6 py-4 text-slate-400 font-mono text-xs truncate max-w-[150px]">
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
    );
}
