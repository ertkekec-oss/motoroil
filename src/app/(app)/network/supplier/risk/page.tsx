import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { getStrictTenantId } from "@/services/contracts/tenantContext";
import { ShieldAlert, Unlock, ArrowRight } from "lucide-react";

export default async function GateSummaryRiskPage() {
    const tenantId = await getStrictTenantId();

    const gateResults = await prisma.networkGateResult.findMany({
        where: { supplierTenantId: tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const blockedCount = gateResults.filter(g => g.result === 'BLOCKED').length;
    const escrowWanted = gateResults.filter(g => g.result === 'ESCROW_REQUIRED').length;
    const allowedOps = gateResults.filter(g => g.result === 'ALLOWED').length;

    return (
        <EnterprisePageShell
            title="Sipariş Gate & Risk Paneli"
            description="B2B ağından gelen cari hareketlerin sözleşme kurallarına göre analiz edilmesi."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <EnterpriseCard className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Engellenen (BLOCKED)</p>
                        <h3 className="text-2xl font-bold">{blockedCount}</h3>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <ArrowRight className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Emanet (ESCROW)</p>
                        <h3 className="text-2xl font-bold">{escrowWanted}</h3>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                        <Unlock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">İzin Verilen (ALLOWED)</p>
                        <h3 className="text-2xl font-bold">{allowedOps}</h3>
                    </div>
                </EnterpriseCard>
            </div>

            <EnterpriseCard noPadding>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-xl">
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">En Son Eligibility Taramaları</h3>
                </div>
                <div className="overflow-x-auto">
                    <EnterpriseTable headers={['Zaman', 'Bayi Membership ID', 'Sonuç', 'Nedeni (ReasonCodes)', 'Detay']}>
                        {gateResults.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-8 text-slate-500">Henüz bir Gate verisi bulunamadı.</td></tr>
                        ) : gateResults.map(gate => {
                            const reasons = Array.isArray(gate.reasonCodesJson) ? gate.reasonCodesJson : [];
                            return (
                                <tr key={gate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td className="p-4 text-xs font-mono text-slate-500">{new Date(gate.createdAt).toLocaleString('tr-TR')}</td>
                                    <td className="p-4 text-sm font-medium">{gate.membershipId}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${gate.result === 'ALLOWED' ? 'bg-green-100 text-green-800' : gate.result === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {gate.result}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-red-600 font-mono">
                                        {reasons.length > 0 ? reasons.join(", ") : '-'}
                                    </td>
                                    <td className="p-4">
                                        {gate.result !== 'ALLOWED' && (
                                            <EnterpriseButton variant="secondary">
                                                Risk Analizi
                                            </EnterpriseButton>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </EnterpriseTable>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
