import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseSectionHeader } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { processPaymentWebhookQueue } from "@/services/payments/queue";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsInboxReplayPage() {
    const failedInboxEvents = await prisma.integrationInbox.findMany({
        where: { status: { in: ['FAILED', 'PENDING'] } },
        orderBy: { receivedAt: 'desc' },
        take: 50
    });

    const handleReplay = async (formData: FormData) => {
        "use server";
        const inboxId = formData.get("inboxId") as string;

        await prisma.integrationInbox.update({
            where: { id: inboxId },
            data: { status: 'PENDING', error: null }
        });

        await processPaymentWebhookQueue.add('inbox', { inboxId }, {
            jobId: `inbox_${inboxId}_replay_${Date.now()}`,
            attempts: 3
        });

        revalidatePath('/admin/ops/inbox-replay');
    };

    return (
        <EnterprisePageShell
            title="Sistem Arşivi & Replay Motoru"
            description="Provider veya API entegrasyonlarından gelip takılı kalmış Webhook ve Outbox eventlerinin sisteme yeniden enjekte edilmesi."
        >
            <EnterpriseCard>
                <EnterpriseSectionHeader title="Integration Inbox (Ödeme / Provider Webhookları)" />
                <p className="text-xs text-slate-500 mb-6 flex items-center gap-2">
                    <AlertTriangle className="text-orange-500 w-4 h-4" />
                    Hata fırlatmış (FAILED) veya işleme girmemiş (PENDING) gelen webhooklar. Replay butonu ile işlem ID'sini resetlemeden (Idempotency korunarak) kuyruğa tekrar basar.
                </p>

                <EnterpriseTable headers={["ID / TÜR", "TARİH", "SAĞLAYICI / EVENT", "DURUM", "HATA DETAYI", "İŞLEM"]}>
                    {failedInboxEvents.map(evt => (
                        <tr key={evt.id}>
                            <td className="px-4 py-3 text-xs font-mono">{evt.providerEventId}</td>
                            <td className="px-4 py-3 text-sm">{evt.receivedAt.toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs uppercase font-bold text-slate-700">{evt.providerKey} / {evt.eventType}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-bold rounded ${evt.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                                    {evt.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-[10px] text-red-600 truncate max-w-[200px]" title={evt.error || "Yok"}>
                                {evt.error || "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <form action={handleReplay}>
                                    <input type="hidden" name="inboxId" value={evt.id} />
                                    <button type="submit" className="text-xs bg-slate-900 justify-end ml-auto text-white px-3 py-1.5 rounded flex items-center hover:bg-slate-800 transition">
                                        <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Requeue (Replay)
                                    </button>
                                </form>
                            </td>
                        </tr>
                    ))}
                    {failedInboxEvents.length === 0 && (
                        <tr><td colSpan={6} className="text-center p-6 text-sm text-slate-500">Yeniden işleme sokulacak bir Inbox Event bulunamadı.</td></tr>
                    )}
                </EnterpriseTable>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
