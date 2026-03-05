import { EnterprisePageShell, EnterpriseCard, EnterpriseSwitch, EnterpriseButton, EnterpriseSectionHeader } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, ServerOff } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsSystemConfigPage() {
    // 1) Fetch Configs
    const configKeys = ['queuesEnabled', 'payoutsEnabled', 'capturesEnabled'];
    const configs = await prisma.b2BSystemConfig.findMany({
        where: { key: { in: configKeys } }
    });

    const configMap = configs.reduce((acc, c) => {
        acc[c.key] = (c.valueJson as any)?.enabled ?? true;
        return acc;
    }, {} as Record<string, boolean>);

    // Default to true if not set
    configKeys.forEach(k => {
        if (typeof configMap[k] === 'undefined') configMap[k] = true;
    });

    const handleToggle = async (formData: FormData) => {
        "use server";
        const key = formData.get("key") as string;
        const currentToggle = formData.get("currentToggle") === 'true';

        await prisma.b2BSystemConfig.upsert({
            where: { key },
            update: { valueJson: { enabled: !currentToggle }, updatedAt: new Date() },
            create: { key, valueJson: { enabled: !currentToggle } }
        });

        // Small audit trail log here in production

        revalidatePath('/admin/ops/system-config');
    };

    return (
        <EnterprisePageShell
            title="Sistem Konfigürasyonu (Kill Switch)"
            description="Acil durumlarda para hareketlerini (Escrow, Payout, Capture) dondurma / durdurma yönetim paneli."
        >
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-4 mb-8">
                <AlertTriangle className="w-6 h-6 mt-1 shrink-0" />
                <div>
                    <h4 className="font-bold mb-1 text-red-900">Uygulama Kritik Bölgesi</h4>
                    <p className="text-sm">Bu paneldeki değişiklikler saniyeler içinde tüm BullMQ worker ve API katmanlarını etkiler. (Idempotency Key'leri resetlemez, sadece kuyruk / api işlemlerini guard limitine takar).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Escrow & Kuyruk Servisleri" />
                    <p className="text-xs text-slate-500 mb-6">Pazar yeri (Escrow) holdlarının ve outbox görevlerinin asenkron işlenmesini kontrol eder.</p>

                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <div>
                            <h5 className="font-bold text-slate-800 flex items-center gap-2"><ServerOff className="w-4 h-4 text-slate-400" /> Queues (Outbox Dispatcher)</h5>
                            <p className="text-xs text-slate-500 mt-1">Kapalıysa hiçbir PENDING outbox BullMQ kuyruğuna alınmaz.</p>
                        </div>
                        <form action={handleToggle} className="flex-shrink-0">
                            <input type="hidden" name="key" value="queuesEnabled" />
                            <input type="hidden" name="currentToggle" value={configMap['queuesEnabled'].toString()} />
                            <button type="submit" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${configMap['queuesEnabled'] ? 'bg-green-500' : 'bg-slate-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${configMap['queuesEnabled'] ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </form>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Ödeme (Payment Intent) İşlemleri" />
                    <p className="text-xs text-slate-500 mb-6">Kartla yapılan B2B çekim, Capture ve Refund süreçlerinin izin akışlarını denetler.</p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <div>
                                <h5 className="font-bold text-slate-800">Captures (Tahsilat Onayı)</h5>
                                <p className="text-xs text-slate-500 mt-1">Kapalıysa provizyondaki tahsilatlar onaylanmaz.</p>
                            </div>
                            <form action={handleToggle} className="flex-shrink-0">
                                <input type="hidden" name="key" value="capturesEnabled" />
                                <input type="hidden" name="currentToggle" value={configMap['capturesEnabled'].toString()} />
                                <button type="submit" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${configMap['capturesEnabled'] ? 'bg-green-500' : 'bg-slate-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${configMap['capturesEnabled'] ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <div>
                                <h5 className="font-bold text-slate-800">Payouts (Satıcı Geri Ödemeleri)</h5>
                                <p className="text-xs text-slate-500 mt-1">Release edilmiş bakiyenin EFT ve transfer çıkışını durdurur.</p>
                            </div>
                            <form action={handleToggle} className="flex-shrink-0">
                                <input type="hidden" name="key" value="payoutsEnabled" />
                                <input type="hidden" name="currentToggle" value={configMap['payoutsEnabled'].toString()} />
                                <button type="submit" className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${configMap['payoutsEnabled'] ? 'bg-green-500' : 'bg-slate-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${configMap['payoutsEnabled'] ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </form>
                        </div>
                    </div>
                </EnterpriseCard>

            </div>
        </EnterprisePageShell>
    );
}
