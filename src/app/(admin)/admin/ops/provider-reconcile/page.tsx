import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { processPaymentWebhookQueue } from "@/services/payments/queue";
import { Search, RotateCcw } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsProviderReconcilePage() {

    const handleReconcile = async (formData: FormData) => {
        "use server";
        const providerKey = formData.get("providerKey") as string;
        const providerRef = formData.get("providerRef") as string;
        const eventType = formData.get("eventType") as string;

        if (!providerRef || !providerKey) return;

        // Create a synthetic IntegrationInbox event simulating a webhook
        const syntheticBody = {
            simulated: true,
            reason: "Admin Provider Drift Reconciliation",
            ref: providerRef,
            statusOverride: "SETTLED"
        };

        const inbox = await prisma.integrationInbox.create({
            data: {
                tenantId: "admin", // Generic 
                providerKey,
                providerEventId: `sync_${providerRef}_${Date.now()}`,
                eventType,
                payloadJson: syntheticBody,
                status: 'PENDING'
            }
        });

        await processPaymentWebhookQueue.add('inbox', { inboxId: inbox.id }, {
            jobId: `synthetic_sync_${inbox.id}`,
            attempts: 3
        });

        revalidatePath('/admin/ops/provider-reconcile');
    };

    return (
        <EnterprisePageShell
            title="Provider Drift Reconcile"
            description="Ödeme sağlayıcı (Iyzico, Odeal vb.) ile DB durum uyuşmazlığında sentetik webhook üreterek durumu idempotent olarak senkronize et."
        >
            <EnterpriseCard>
                <EnterpriseSectionHeader title="Manuel Senkronizasyon (Synthetic Event Üretimi)" />
                <p className="text-xs text-slate-500 mb-6">
                    Asla veritabanını elle (DataGrip/PrismaStudio vs) değiştirmeyin. "CAPTURED" ya da "SETTLED" işlemler eksikse buradan referans gönderin. Worker'lar idempotent kurallarla log ve journal'leri bağlayarak state'i provider a göre ileri sarar.
                </p>

                <form action={handleReconcile} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 border border-slate-100 p-4 rounded-lg">

                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">Provider Key</label>
                        <input type="text" name="providerKey" required className="w-full text-xs font-mono border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500" placeholder="Örn: manual_bank" />
                    </div>

                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">Provider Ref / ID</label>
                        <input type="text" name="providerRef" required className="w-full text-xs font-mono border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500" placeholder="TRX-12345..." />
                    </div>

                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">Event Type</label>
                        <select name="eventType" className="w-full text-xs font-mono border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500">
                            <option value="PAYOUT_SETTLED">PAYOUT_SETTLED (EFT Çıktı)</option>
                            <option value="PAYMENT_CAPTURED">PAYMENT_CAPTURED (Kayıp Tahsilat)</option>
                            <option value="PAYMENT_REFUNDED">PAYMENT_REFUNDED (Kayıp İade)</option>
                            <option value="CHARGEBACK_WON">CHARGEBACK_WON</option>
                            <option value="CHARGEBACK_LOST">CHARGEBACK_LOST</option>
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <EnterpriseButton variant="primary" type="submit" className="w-full flex justify-center !h-8 text-xs font-bold gap-2">
                            <RotateCcw className="w-3.5 h-3.5" /> Reconcile Tetikle
                        </EnterpriseButton>
                    </div>
                </form>

            </EnterpriseCard>

        </EnterprisePageShell>
    );
}
