import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NetworkGrowthTriggersPage() {
    const triggers = await prisma.networkGrowthTrigger.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b pb-4">Growth Triggers</h1>
                <p className="text-slate-500 mt-2">
                    Autonomous intelligence derived from Trade Completions and Liquidity patterns.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Discovered Opportunities</h2>
                </div>
                <div className="p-0">
                    {triggers.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-sm">
                            No active growth triggers detected yet out of recent trades.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                    <tr>
                                        <th className="px-6 py-3">Detected At</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Score</th>
                                        <th className="px-6 py-3">Involved Tenants (B/S)</th>
                                        <th className="px-6 py-3">Product Category</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {triggers?.map((trigger) => (
                                        <tr key={trigger.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900">
                                                {new Date(trigger.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-indigo-600">{trigger.triggerType}</span>
                                            </td>
                                            <td className="px-6 py-4">{Number(trigger.triggerStrength || 0).toFixed(0)} / 100</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 space-y-1">
                                                <div><span className="font-medium text-slate-900">B:</span> {trigger.buyerTenantId || '-'}</div>
                                                <div><span className="font-medium text-slate-900">S:</span> {trigger.sellerTenantId || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">{trigger.canonicalProductId || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trigger.status === 'OPEN' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                                    {trigger.status}
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
    );
}
