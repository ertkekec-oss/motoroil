import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseSectionHeader } from "@/components/ui/enterprise";
import { getDrillRuns, createDrillRun } from "@/services/ops/drills";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsDrDrillPage() {
    const drills = await getDrillRuns();

    const handleNewDrill = async (formData: FormData) => {
        "use server";
        const rto = parseInt(formData.get("rtoMinutes") as string) || 0;
        const rpo = parseInt(formData.get("rpoMinutes") as string) || 0;
        const status = formData.get("status") as 'PASSED' | 'FAILED' | 'NEEDS_IMPROVEMENT';
        const notes = formData.get("notes") as string;

        await createDrillRun({
            date: new Date(),
            rtoMinutes: rto,
            rpoMinutes: rpo,
            status,
            detailsJson: { notes },
            createdBy: 'SystemAdmin'
        });

        revalidatePath('/admin/ops/dr-drill');
    };

    return (
        <EnterprisePageShell
            title="Sistem Geri Yükleme & DR Tatbikatları"
            description="Felaket kurtarma senaryolarına (DR) yönelik planlı restorenin (Neon / S3) operasyonel denetimi."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-1">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Yeni Tatbikat Raporla" />
                        <form action={handleNewDrill} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">RTO (Kurtarma Süresi) (Dk)</label>
                                <input type="number" name="rtoMinutes" required className="w-full text-sm border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500" placeholder="Örn: 15" />
                                <p className="text-[10px] text-slate-500 mt-1">Sistemin tamamen ayağa kalkma süresi.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">RPO (Veri Kaybı) (Dk)</label>
                                <input type="number" name="rpoMinutes" required className="w-full text-sm border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500" placeholder="Örn: 5" />
                                <p className="text-[10px] text-slate-500 mt-1">Kabul edilebilir max kayıp / Restore noktası yaşı.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Durum</label>
                                <select name="status" className="w-full text-sm border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500">
                                    <option value="PASSED">BAŞARILI (PASSED)</option>
                                    <option value="NEEDS_IMPROVEMENT">GELİŞTİRİLMELİ (NEEDS_IMPROVEMENT)</option>
                                    <option value="FAILED">BAŞARISIZ (FAILED)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Notlar / Engeller</label>
                                <textarea name="notes" rows={3} className="w-full text-sm border-slate-300 rounded p-2 focus:ring-1 focus:ring-slate-500" placeholder="Sign endpoint gecikti vb..." />
                            </div>
                            <EnterpriseButton type="submit" variant="primary" className="w-full">Raporla</EnterpriseButton>
                        </form>
                    </EnterpriseCard>
                </div>

                <div className="lg:col-span-2">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Geçmiş Tatbikat Logları (OpsDrillRun)" />
                        <EnterpriseTable headers={["TARİH", "RTO", "RPO", "DURUM", "NOTLAR", "RAPORTÖR"]}>
                            {drills.map(d => (
                                <tr key={d.id}>
                                    <td className="px-4 py-3 text-xs">{d.date.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-mono">{d.rtoMinutes} Dk</td>
                                    <td className="px-4 py-3 text-xs font-mono">{d.rpoMinutes} Dk</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded ${d.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                                                d.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[10px] truncate max-w-[200px]" title={(d.detailsJson as any)?.notes}>
                                        {(d.detailsJson as any)?.notes || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs">{d.createdBy}</td>
                                </tr>
                            ))}
                            {drills.length === 0 && (
                                <tr><td colSpan={6} className="text-center p-6 text-sm text-slate-500">Hiç DR tatbikat kaydı bulunmuyor.</td></tr>
                            )}
                        </EnterpriseTable>
                    </EnterpriseCard>
                </div>

            </div>
        </EnterprisePageShell>
    );
}
