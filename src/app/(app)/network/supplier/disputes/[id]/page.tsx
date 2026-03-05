import { EnterprisePageShell, EnterpriseCard, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { getStrictTenantId } from "@/services/contracts/tenantContext";
import { AlertTriangle, Download, ArrowRight } from "lucide-react";
import { refundEscrowQueue, releaseEscrowQueue } from "@/services/payments/queue";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
    const tenantId = await getStrictTenantId();
    const { id } = params;

    const dispute = await prisma.networkDisputeCase.findUnique({
        where: { id, supplierTenantId: tenantId },
        include: { events: { orderBy: { createdAt: "desc" } } }
    });

    if (!dispute) {
        return (
            <EnterprisePageShell title="Uyuşmazlık Ayrıntısı">
                <EnterpriseCard title="Hata">Bulunamadı veya Yetkisiz Erişim.</EnterpriseCard>
            </EnterprisePageShell>
        );
    }

    // Identify Escrow relationship
    let hasEscrow = false;
    if (dispute.escrowCaseId) hasEscrow = true;

    const handleResolveRefund = async () => {
        "use server";
        // Marking dispute resolved
        await prisma.networkDisputeCase.update({
            where: { id: dispute.id },
            data: { status: 'RESOLVED', resolvedAt: new Date() }
        });
        await prisma.networkDisputeEvent.create({
            data: {
                supplierTenantId: dispute.supplierTenantId,
                disputeCaseId: dispute.id,
                action: 'RESOLVED',
                metaJson: { resolution: "REFUND_APPROVED" }
            }
        });

        if (dispute.escrowCaseId) {
            await refundEscrowQueue.add('refund', {
                escrowCaseId: dispute.escrowCaseId,
                amount: dispute.claimedAmount ? Number(dispute.claimedAmount) : undefined
            });
        }
        revalidatePath(`/network/supplier/disputes/${id}`);
    };

    const handleReject = async () => {
        "use server";
        // Reject dispute => release escrow safely
        await prisma.networkDisputeCase.update({
            where: { id: dispute.id },
            data: { status: 'REJECTED', resolvedAt: new Date() }
        });
        await prisma.networkDisputeEvent.create({
            data: {
                supplierTenantId: dispute.supplierTenantId,
                disputeCaseId: dispute.id,
                action: 'REJECTED',
                metaJson: { resolution: "DISPUTE_REJECTED" }
            }
        });

        if (dispute.escrowCaseId) {
            // Once rejected, funds should be released to supplier normally
            const escrow = await prisma.escrowCase.findUnique({ where: { id: dispute.escrowCaseId } });
            if (escrow) {
                // Actually, escrow might require transition back to `FUNDS_HELD` or direct `release`.
                // Let's release it directly (worker handles it securely if not DISPUTED any more):
                await prisma.escrowCase.update({ where: { id: escrow.id }, data: { status: 'FUNDS_HELD' } });
                await releaseEscrowQueue.add('release', { escrowCaseId: escrow.id });
            }
        }
        revalidatePath(`/network/supplier/disputes/${id}`);
    };

    return (
        <EnterprisePageShell
            title={`Uyuşmazlık #${dispute.id.slice(-8).toUpperCase()}`}
            description="Escrow bağlantılı teslimat veya iptal uyuşmazlığı."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Uyuşmazlık Yönetimi" />
                        <div className="bg-red-50 p-4 border border-red-100 rounded-lg flex items-center justify-between mb-6">
                            <div>
                                <AlertTriangle className="text-red-600 mb-1" />
                                <h3 className="font-semibold text-red-900">Durum: {dispute.status}</h3>
                                <p className="text-sm text-red-700">Gerekçe: {dispute.reason}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Talep Edilen İade</p>
                                <p className="text-xl font-bold text-slate-800 border-b border-red-300">
                                    {dispute.claimedAmount ? dispute.claimedAmount.toString() + " TRY" : "Tam İade"}
                                </p>
                            </div>
                        </div>

                        <h4 className="font-semibold text-sm mb-2">Karar Ver (Resolution)</h4>
                        <div className="flex gap-4">
                            <form action={handleResolveRefund}>
                                <EnterpriseButton variant="primary" disabled={dispute.status === 'RESOLVED' || dispute.status === 'REJECTED'}>
                                    İadeyi Onayla (Refund)
                                    {hasEscrow && <span className="text-[10px] ml-2 bg-white/20 px-1 py-0.5 rounded">Escrow Tetiklenir</span>}
                                </EnterpriseButton>
                            </form>
                            <form action={handleReject}>
                                <EnterpriseButton variant="secondary" disabled={dispute.status === 'RESOLVED' || dispute.status === 'REJECTED'}>
                                    Talebi Reddet
                                    {hasEscrow && <span className="text-[10px] ml-2 px-1 py-0.5 border border-slate-300 rounded text-slate-500">Serbest Bırak (Release)</span>}
                                </EnterpriseButton>
                            </form>
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Yazışma ve İşlemler" />
                        <div className="space-y-4">
                            {dispute.events.map(event => (
                                <div key={event.id} className="text-sm flex p-3 border border-slate-100 rounded items-center bg-slate-50">
                                    <span className="font-semibold w-24">{event.action}</span>
                                    <span className="text-slate-500 ml-4">{event.createdAt.toLocaleString()}</span>
                                    <span className="text-slate-500 ml-auto">{JSON.stringify(event.metaJson)}</span>
                                </div>
                            ))}
                        </div>
                    </EnterpriseCard>
                </div>

                <div className="space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Kanıt (Evidence)" />
                        {dispute.evidenceBundleBlobId ? (
                            <EnterpriseButton variant="secondary" className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Kanıt Dosyası
                            </EnterpriseButton>
                        ) : (
                            <p className="text-xs text-slate-500">Bu uyuşmazlığa eklenmiş bir kanıt belgesi bulunmamaktadır.</p>
                        )}
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
