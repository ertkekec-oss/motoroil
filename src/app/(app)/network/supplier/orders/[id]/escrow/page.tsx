import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { getStrictTenantId } from "@/services/contracts/tenantContext";
import { CheckCircle, Clock } from "lucide-react";
import { releaseEscrowQueue, refundEscrowQueue } from "@/services/payments/queue";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OrderEscrowPage({ params }: { params: { id: string } }) {
    const tenantId = await getStrictTenantId();
    const { id: orderId } = params;

    const escrowCase = await prisma.escrowCase.findFirst({
        where: { orderId, supplierTenantId: tenantId },
        include: { events: { orderBy: { createdAt: "desc" } } }
    });

    if (!escrowCase) {
        return (
            <EnterprisePageShell title="Escrow Bilgileri">
                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Bulunamadı" />
                    Bu sipariş için kayıtlı bir Escrow (Emanet) süreci bulunmuyor.
                </EnterpriseCard>
            </EnterprisePageShell>
        );
    }

    // Action handlers using Server Actions
    const handleRelease = async () => {
        "use server";
        await releaseEscrowQueue.add('release', { escrowCaseId: escrowCase.id });
        revalidatePath(`/network/supplier/orders/${orderId}/escrow`);
    };

    const handleRefund = async () => {
        "use server";
        // Manual full refund assumption for demo, disputes normally dictate amount
        await refundEscrowQueue.add('refund', { escrowCaseId: escrowCase.id, amount: Number(escrowCase.amount) });
        revalidatePath(`/network/supplier/orders/${orderId}/escrow`);
    };

    return (
        <EnterprisePageShell
            title={`Sipariş #${orderId} - Escrow Durumu`}
            description="B2B Ağı Emanet Hesabı Yönetimi"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <EnterpriseCard className="min-h-[200px]">
                        <EnterpriseSectionHeader title="Escrow Durumu" />
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                            <div>
                                <p className="text-sm text-slate-500">Durum</p>
                                <p className="text-xl font-bold text-slate-900">{escrowCase.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Tutar</p>
                                <p className="text-xl font-bold text-[#1F3A5F]">
                                    {Number(escrowCase.amount).toLocaleString("tr-TR", { style: "currency", currency: escrowCase.currency })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Hold Modu</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-md ${escrowCase.holdMode === 'OPERATIONAL' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {escrowCase.holdMode}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <form action={handleRelease}>
                                <EnterpriseButton
                                    variant="primary"
                                    disabled={escrowCase.status !== "FUNDS_HELD"}
                                    className={escrowCase.status === 'RELEASED' ? 'opacity-50' : ''}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Bakiyeyi Serbest Bırak
                                </EnterpriseButton>
                            </form>

                            <form action={handleRefund}>
                                <EnterpriseButton
                                    variant="secondary"
                                    disabled={escrowCase.status !== "DISPUTED" && escrowCase.status !== "FUNDS_HELD"}
                                >
                                    <Clock className="w-4 h-4 mr-2" /> İade Et (Refund)
                                </EnterpriseButton>
                            </form>
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="İşlem Geçmişi (Timeline)" />
                        <div className="space-y-4">
                            {escrowCase.events.map(event => (
                                <div key={event.id} className="flex gap-4 p-3 bg-white border border-slate-100 rounded-lg items-center">
                                    <div className="text-xs text-slate-500 w-24 flex-shrink-0">
                                        {event.createdAt.toLocaleTimeString()}
                                    </div>
                                    <div className="font-semibold text-sm text-slate-800 w-48">
                                        {event.action}
                                    </div>
                                    <div className="text-xs text-slate-500 flex-grow truncate">
                                        {event.metaJson ? JSON.stringify(event.metaJson) : ""}
                                    </div>
                                </div>
                            ))}
                            {escrowCase.events.length === 0 && (
                                <p className="text-sm text-slate-500 italic">Kayıt bulunamadı.</p>
                            )}
                        </div>
                    </EnterpriseCard>
                </div>

                <div className="space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Hukuki Uyarılar" />
                        <ul className="text-xs text-slate-600 space-y-2">
                            <li>- <b>OPERATIONAL</b> modda tutulan bakiyeler muhasebe hesaplarınızda Emanet Yükümlülüğü olarak raporlanır.</li>
                            <li>- Serbest bırakma (Release) işlemi geri alınamaz.</li>
                            <li>- Uyuşmazlık (Dispute) devam ediyorsa bakiye otomatik bırakılmaz.</li>
                        </ul>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
