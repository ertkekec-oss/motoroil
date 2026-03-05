import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseSectionHeader } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { Check, X } from "lucide-react";
import { finalizeEscrowRelease } from "@/services/payments/payoutLogic";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsBankMatchReviewPage() {
    // 1) Load Instructions needing review
    const needsReviewInst = await prisma.settlementInstruction.findMany({
        where: { status: 'NEEDS_REVIEW' },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    // 2) Load Unmatched Inbox Transactions
    const unmatchedTxs = await prisma.b2BBankTransactionInbox.findMany({
        where: { matched: false },
        orderBy: { occurredAt: 'desc' },
        take: 20
    });

    const handleManualMatch = async (formData: FormData) => {
        "use server";
        const txId = formData.get("txId") as string;
        const instId = formData.get("instId") as string;

        // Force match (Manual reconciliation)
        const instruction = await prisma.settlementInstruction.findUnique({ where: { id: instId } });
        if (!instruction || instruction.status === 'SETTLED') return;

        await prisma.b2BBankTransactionInbox.update({
            where: { id: txId },
            data: { matched: true, settlementInstId: instId }
        });

        await finalizeEscrowRelease(instruction.escrowCaseId, instruction.id);
        revalidatePath('/admin/ops/bank-match-review');
    };

    return (
        <EnterprisePageShell
            title="Banka Eşleştirme Gözden Geçirme (Manual Reconcile)"
            description="Otomatik eşleşemeyen, belirsiz (ambiguous) veya manuel müdahale bekleyen ödemeler."
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="1) İncelenecek Talimatlar (NEEDS_REVIEW)" />
                    <p className="text-xs text-slate-500 mb-4">Otomatik motor tarafından tutar olarak uyumlu olduğu sanılan ama Referans uyuşmazlığından reddedilen/bekletilen çıkışlar.</p>
                    {needsReviewInst.length === 0 ? (
                        <div className="text-sm bg-slate-50 border border-slate-100 p-4 rounded text-center text-slate-500">
                            İnceleme bekleyen talimat yok.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {needsReviewInst.map(inst => (
                                <div key={inst.id} className="p-3 border border-orange-200 bg-orange-50 rounded text-sm relative">
                                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-orange-200 text-orange-900 px-2 py-0.5 rounded">NEEDS_REVIEW</span>
                                    <p className="font-mono font-bold mb-1">{Number(inst.amount).toLocaleString('tr-TR')} {inst.currency}</p>
                                    <p className="text-slate-600">ID: {inst.idempotencyKey.slice(0, 16)}...</p>
                                    <p className="text-xs text-slate-800 font-medium">Tenant: {inst.tenantId.slice(0, 8)} | Escrow: {inst.escrowCaseId.slice(0, 8)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="2) Eşleşmemiş Gelen Banka Hareketleri" />
                    <p className="text-xs text-slate-500 mb-4">Bankadan gelen fakat Sistemde bir IdempotencyKey ile otomatik bağlanamamış hareketler.</p>
                    {unmatchedTxs.length === 0 ? (
                        <div className="text-sm bg-slate-50 border border-slate-100 p-4 rounded text-center text-slate-500">
                            Tüm hareketler eşleşmiş.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {unmatchedTxs.map(tx => (
                                <div key={tx.id} className="p-4 border border-slate-200 bg-white shadow-sm rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-mono font-bold text-slate-900">{Number(tx.amount).toLocaleString('tr-TR')} {tx.currency}</span>
                                        <span className="text-xs text-slate-500">{tx.occurredAt.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs bg-slate-50 p-2 text-slate-700 font-mono mb-4 border border-slate-100">{tx.description}</p>

                                    <form action={handleManualMatch} className="flex gap-2 isolate">
                                        <input type="hidden" name="txId" value={tx.id} />
                                        <select
                                            name="instId"
                                            required
                                            className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-50"
                                        >
                                            <option value="">-- Talimat Seç (Review İsteyen) --</option>
                                            {needsReviewInst.map(inst => (
                                                <option key={inst.id} value={inst.id}>{inst.idempotencyKey.slice(0, 10)} - {inst.amount.toString()}</option>
                                            ))}
                                        </select>
                                        <EnterpriseButton variant="primary" className="!h-8 !px-3 font-bold !text-xs shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                                            Zorla Eşleştir
                                        </EnterpriseButton>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </EnterpriseCard>
            </div>

        </EnterprisePageShell>
    );
}
