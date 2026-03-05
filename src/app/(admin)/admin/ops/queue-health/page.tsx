import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseSectionHeader } from "@/components/ui/enterprise";
import { getQueueMetrics, performQueueAction } from "@/services/ops/queueMetrics";
import { AlertTriangle, Power, Pause, Play, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsQueueHealthPage() {
    const metrics = await getQueueMetrics();

    const handleAction = async (formData: FormData) => {
        "use server";
        const qName = formData.get("qName") as string;
        const action = formData.get("action") as "pause" | "resume" | "drain";

        await performQueueAction(qName, action);
        revalidatePath('/admin/ops/queue-health');
    };

    return (
        <EnterprisePageShell
            title="Kuyruk ve Worker Sağlığı (BullMQ)"
            description="Para ve escow süreçlerini yöneten asenkron kuyrukların anlık durumu ve acil müdahale (Drain/Pause) merkezi."
        >
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-start gap-4 mb-8">
                <AlertTriangle className="w-6 h-6 mt-1 shrink-0" />
                <div>
                    <h4 className="font-bold mb-1 text-orange-900">Drain (Boşaltma) Uyarısı</h4>
                    <p className="text-sm">"Drain" komutu, kuyrukta bekleyen (waiting) tüm işleri kalıcı olarak siler ve işlenmesini engeller. Sadece stuck-loop (açık döngü) halinde veya manuel telafi edilebilecek idempotency durumlarında kullanın.</p>
                </div>
            </div>

            <EnterpriseCard>
                <EnterpriseSectionHeader title="Aktif Finansal Kuyruklar" />
                <EnterpriseTable headers={["KUYRUK", "DURUM", "WAITING", "ACTIVE", "FAILED", "OLDEST JOB AGE", "MÜDAHALE"]}>
                    {metrics.map(m => (
                        <tr key={m.name}>
                            <td className="px-4 py-3 text-xs font-mono font-bold text-slate-800">{m.name}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-[10px] font-bold rounded ${m.isPaused ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                    {m.isPaused ? 'PAUSED' : 'RUNNING'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-slate-700">{m.counts.waiting || 0}</td>
                            <td className="px-4 py-3 text-sm font-mono text-blue-700 font-bold">{m.counts.active || 0}</td>
                            <td className="px-4 py-3 text-sm font-mono text-red-700 font-bold">{m.counts.failed || 0}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                                {m.oldestJobAgeMs ? `${Math.floor(m.oldestJobAgeMs / 1000)}s` : "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <form action={handleAction} className="flex items-center gap-2 justify-end isolate">
                                    <input type="hidden" name="qName" value={m.name} />

                                    {m.isPaused ? (
                                        <button name="action" value="resume" type="submit" className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded flex items-center hover:bg-green-200">
                                            <Play className="w-3 h-3 mr-1" /> Resume
                                        </button>
                                    ) : (
                                        <button name="action" value="pause" type="submit" className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center hover:bg-orange-200">
                                            <Pause className="w-3 h-3 mr-1" /> Pause
                                        </button>
                                    )}

                                    <button name="action" value="drain" type="submit" onClick={e => !confirm('Tüm bekleyen işleri silmek istediğinize emin misiniz? (Geri alınamaz)') && e.preventDefault()} className="text-[10px] bg-red-100 text-red-800 px-2 py-1 flex items-center rounded hover:bg-red-200">
                                        <Trash2 className="w-3 h-3 mr-1" /> Drain All
                                    </button>
                                </form>
                            </td>
                        </tr>
                    ))}
                    {metrics.length === 0 && (
                        <tr><td colSpan={7} className="text-center p-6 text-sm text-slate-500">Redis bağlantısı bulunamadı (veya lokal build ortamı).</td></tr>
                    )}
                </EnterpriseTable>
            </EnterpriseCard>

        </EnterprisePageShell>
    );
}
