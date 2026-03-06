import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { getStrictTenantId } from "@/services/contracts/tenantContext";
import { CreditCard, Download, PlayCircle, CheckCircle } from "lucide-react";
import { executePayoutQueue } from "@/services/payments/queue";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SupplierSettlementsPage() {
    const tenantId = await getStrictTenantId();

    const instructions = await prisma.settlementInstruction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
    });

    const statusBadgeColors: Record<string, string> = {
        PENDING: "bg-blue-100 text-blue-800",
        EXECUTING: "bg-orange-100 text-orange-800",
        SETTLED: "bg-green-100 text-green-800",
        FAILED: "bg-red-100 text-red-800",
        CANCELED: "bg-slate-100 text-slate-800"
    };

    const handleExecute = async (formData: FormData) => {
        "use server";
        const id = formData.get("instructionId") as string;
        await executePayoutQueue.add('execute', { instructionId: id });
        revalidatePath('/network/supplier/settlements');
    };

    const pendingTotal = instructions.filter(i => i.status === 'PENDING').reduce((acc, i) => acc + Number(i.amount), 0);
    const executingTotal = instructions.filter(i => i.status === 'EXECUTING').reduce((acc, i) => acc + Number(i.amount), 0);
    const settledTotal = instructions.filter(i => i.status === 'SETTLED').reduce((acc, i) => acc + Number(i.amount), 0);


    return (
        <EnterprisePageShell
            title="Ödeme & Mutabakat Merkezi (Settlements)"
            description="Serbest bırakılan Escrow bakiyelerinin banka hesabı transfer süreçleri"
            actions={
                <form action={async () => { "use server"; }}>
                    <EnterpriseButton variant="secondary">
                        <Download className="w-4 h-4 mr-2" /> Toplu Transfer Formatı (CSV)
                    </EnterpriseButton>
                </form>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <EnterpriseCard>
                    <p className="text-sm font-semibold text-slate-500 mb-1">Bekleyen Transfer (PND)</p>
                    <p className="text-2xl font-bold font-mono">{pendingTotal.toLocaleString('tr-TR')} TRY</p>
                </EnterpriseCard>

                <EnterpriseCard borderLeftColor="#F97316">
                    <p className="text-sm font-semibold text-slate-500 mb-1">İşlemde (EFT Ops)</p>
                    <p className="text-2xl font-bold font-mono text-orange-600">{executingTotal.toLocaleString('tr-TR')} TRY</p>
                </EnterpriseCard>

                <EnterpriseCard borderLeftColor="#22C55E">
                    <p className="text-sm font-semibold text-slate-500 mb-1">Gerçekleşen (Banka Onaylı)</p>
                    <p className="text-2xl font-bold font-mono text-green-600">{settledTotal.toLocaleString('tr-TR')} TRY</p>
                </EnterpriseCard>
            </div>

            <EnterpriseCard noPadding>
                <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-slate-600" />
                        Payout Talimatları
                    </h3>
                </div>
                <EnterpriseTable headers={["ID", "TARİH", "ESCROW REF", "TUTAR", "PROVIDER", "DURUM", "İŞLEM"]}>
                    {instructions.map(inst => (
                        <tr key={inst.id}>
                            <td className="px-4 py-3 text-xs font-mono">{inst.idempotencyKey.slice(0, 16)}</td>
                            <td className="px-4 py-3 text-sm">{inst.createdAt.toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-blue-600">{inst.escrowCaseId.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-sm font-bold font-mono">{Number(inst.amount).toLocaleString('tr-TR')} {inst.currency}</td>
                            <td className="px-4 py-3 text-xs uppercase">{inst.providerKey}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-bold rounded ${statusBadgeColors[inst.status] || "bg-slate-100"}`}>
                                    {inst.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                {inst.status === 'PENDING' ? (
                                    <form action={handleExecute}>
                                        <input type="hidden" name="instructionId" value={inst.id} />
                                        <button type="submit" className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded flex items-center hover:bg-slate-800 transition">
                                            <PlayCircle className="w-3.5 h-3.5 mr-1" /> Başlat
                                        </button>
                                    </form>
                                ) : inst.status === 'EXECUTING' ? (
                                    <span className="text-[10px] text-slate-500 flex items-center">Banka Yanıtı Bekleniyor</span>
                                ) : (
                                    <span className="text-[10px] text-green-600 flex items-center font-bold">
                                        <CheckCircle className="w-3 h-3 mr-1" /> {inst.settledAt?.toLocaleDateString()}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {instructions.length === 0 && (
                        <tr><td colSpan={7} className="text-center p-6 text-sm text-slate-500">Hiçbir ödeme talimatı bulunmamaktadır.</td></tr>
                    )}
                </EnterpriseTable>
            </EnterpriseCard>

            <div className="mt-8 text-xs text-slate-500 p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
                <p><b>Muhasebe Notu:</b> "İşlemde (EFT Ops)" durumundaki talimatların ödemesi yapıldıktan sonra banka hareketleriniz (Bank Feed Inbox) üzerinden otomatik eşleşme yapılır veya tarafınızca manuel "SETTLED" olarak güncellenmesi gerekir. Sadece "SETTLED" olduğunda Escrow tamamen "RELEASED" sayılır ve 336 / 102 muhasebe kayıtları kapanır.</p>
            </div>
        </EnterprisePageShell>
    );
}
