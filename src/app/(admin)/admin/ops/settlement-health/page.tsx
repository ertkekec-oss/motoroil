import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseSectionHeader } from "@/components/ui/enterprise";
import { runSettlementHealthCheck } from "@/services/payments/opsHealth";
import { Activity, AlertOctagon, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OpsSettlementHealthPage() {
    const report = await runSettlementHealthCheck();

    const totalIssues =
        report.capturedNotHeld.length +
        report.heldNoJournal.length +
        report.settledNoJournal.length +
        report.releasedInstructionNotSettled.length +
        report.stuckExecuting.length;

    return (
        <EnterprisePageShell
            title="Ops Güvenliği: Settlement State Health"
            description="B2B Ödeme / Emanet sisteminin tutarlılık kontrolleri ve sağlık raporu"
        >
            <EnterpriseCard className="mb-8 p-6 flex items-center gap-6" borderLeftColor={totalIssues > 0 ? "#E11D48" : "#16A34A"}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: totalIssues > 0 ? "#FFE4E6" : "#DCFCE7" }}>
                    {totalIssues > 0 ? <AlertOctagon className="w-8 h-8 text-rose-600" /> : <CheckCircle2 className="w-8 h-8 text-green-600" />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-1">{totalIssues === 0 ? "Sistem Sağlıklı" : `${totalIssues} Adet İhlal (Invariant Violation) Tespit Edildi`}</h2>
                    <p className="text-sm text-slate-500">Tüm sistem tutarlılık testleri (Invariants) {new Date().toLocaleString()} itibariyle değerlendirildi.</p>
                </div>
            </EnterpriseCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="1) Captured but Not Held" />
                    <p className="text-xs text-slate-500 mb-4">Kartla çekilmiş ama Escrow hesabı FUNDS_HELD'e geçememiş ödemeler.</p>
                    {report.capturedNotHeld.length === 0 ? (
                        <div className="p-3 text-sm text-green-700 bg-green-50 rounded">Sorun yok</div>
                    ) : (
                        <div className="space-y-2">
                            {report.capturedNotHeld.map((item, i) => (
                                <div key={i} className="text-xs bg-rose-50 text-rose-800 p-2 rounded flex justify-between">
                                    <span>Intent: {item.intentId}</span>
                                    <span>Escrow: {item.escrowId}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="2) Held without Journal" />
                    <p className="text-xs text-slate-500 mb-4">Emanette gözüken ama 336 Liability (Muhasebe) hesabı oluşmamış kayıtlar.</p>
                    {report.heldNoJournal.length === 0 ? (
                        <div className="p-3 text-sm text-green-700 bg-green-50 rounded">Sorun yok</div>
                    ) : (
                        <div className="space-y-2">
                            {report.heldNoJournal.map((item, i) => (
                                <div key={i} className="text-xs bg-rose-50 text-rose-800 p-2 rounded">
                                    <span>Escrow: {item.escrowId}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="3) Settled without Account Posting" />
                    <p className="text-xs text-slate-500 mb-4">Bankaya giden payout SETTLED statüsünde ancak 102/336 Journal kapatılmamış.</p>
                    {report.settledNoJournal.length === 0 ? (
                        <div className="p-3 text-sm text-green-700 bg-green-50 rounded">Sorun yok</div>
                    ) : (
                        <div className="space-y-2">
                            {report.settledNoJournal.map((item, i) => (
                                <div key={i} className="text-xs bg-rose-50 text-rose-800 p-2 rounded flex justify-between">
                                    <span>Inst: {item.instructionId}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="4) Released but Not Settled" />
                    <p className="text-xs text-slate-500 mb-4">Escrow RELEASED statüsünde ama Settlement Instruction SETTLED (Banka tamam) değil.</p>
                    {report.releasedInstructionNotSettled.length === 0 ? (
                        <div className="p-3 text-sm text-green-700 bg-green-50 rounded">Sorun yok</div>
                    ) : (
                        <div className="space-y-2">
                            {report.releasedInstructionNotSettled.map((item, i) => (
                                <div key={i} className="text-xs bg-rose-50 text-rose-800 p-2 rounded flex justify-between">
                                    <span>Escrow: {item.escrowId}</span>
                                    <span>Inst: ({item.instructionStatus})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="5) Stuck EXECUTING (>2 Saat)" />
                    <p className="text-xs text-slate-500 mb-4">Bankaya yollanmış ancak uzun süredir Feed Inbox eşleşmesi bekleyen transferler.</p>
                    {report.stuckExecuting.length === 0 ? (
                        <div className="p-3 text-sm text-green-700 bg-green-50 rounded">Sorun yok</div>
                    ) : (
                        <div className="space-y-2">
                            {report.stuckExecuting.map((item, i) => (
                                <div key={i} className="text-xs bg-orange-50 text-orange-800 p-2 rounded flex justify-between">
                                    <span>Inst: {item.idempotencyKey}</span>
                                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

            </div>
        </EnterprisePageShell>
    );
}
