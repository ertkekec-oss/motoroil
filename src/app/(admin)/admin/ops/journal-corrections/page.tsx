import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, Plus } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function OpsJournalCorrectionsPage() {

    // Fetch last 20 corrections
    const corrections = await prisma.b2BJournalEntry.findMany({
        where: { sourceType: 'CORRECTION' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { lines: true }
    });

    const handleCorrection = async (formData: FormData) => {
        "use server";
        const entryId = formData.get("entryId") as string;
        const reason = formData.get("reason") as string;

        if (!entryId || !reason) return;

        // Validation
        const origEntry = await prisma.b2BJournalEntry.findUnique({
            where: { id: entryId },
            include: { lines: true }
        });

        if (!origEntry || origEntry.status === 'VOID') return;

        // Perform Correction (Reverse Lines)
        await prisma.b2BJournalEntry.create({
            data: {
                tenantId: origEntry.tenantId,
                sourceType: 'CORRECTION',
                sourceId: `REV-${origEntry.sourceId}`,
                originalEntryId: origEntry.id,
                reason,
                status: 'POSTED',
                lines: {
                    create: origEntry.lines.map(l => ({
                        tenantId: l.tenantId,
                        accountId: l.accountId,
                        debit: l.credit, // SWAP
                        credit: l.debit, // SWAP
                        currency: l.currency,
                        description: `[CORRECTION] ${reason} (Ref: ${origEntry.id})`
                    }))
                }
            }
        });

        // Void the original entry
        await prisma.b2BJournalEntry.update({
            where: { id: origEntry.id },
            data: { status: 'VOID' }
        });

        revalidatePath('/admin/ops/journal-corrections');
    };

    return (
        <EnterprisePageShell
            title="Düzeltme Fişleri (Journal Correction Runbook)"
            description="Hatalı muhasebe kayıtlarının silinmeden, ters (reversal) kayıt / düzeltme fişi ile denetlenmesi."
        >
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 mb-6">
                <AlertTriangle className="w-5 h-5 mt-0.5 text-blue-700" />
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">Finansal Veritabanlarında DELETE Yoktur</h4>
                    <p className="text-xs text-slate-600">Herhangi bir B2BJournalEntry kaydı teknik olarak "yanlış" olsa dahi, silme işlemi yerine CORRECTION kaydı ile ters işlem eklenir. Void flag'i ile gösterilir.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-1 border border-rose-200 bg-rose-50 rounded p-4 h-fit">
                    <h5 className="font-bold text-rose-900 mb-4 text-sm flex items-center"><Plus className="w-4 h-4 mr-1" /> Ters Fiş Oluştur (Correction)</h5>
                    <form action={handleCorrection} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">Yanlış Kayıt (B2BJournalEntry) ID'si</label>
                            <input type="text" name="entryId" required className="w-full text-xs font-mono border-slate-300 rounded p-2 focus:border-rose-400 focus:ring-rose-400" placeholder="cm..." />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">Düzeltme Gerekçesi (Zorunlu İç Denetim)</label>
                            <textarea name="reason" required minLength={10} rows={4} className="w-full text-xs border-slate-300 rounded p-2 focus:border-rose-400 focus:ring-rose-400" placeholder="KDV oranı hatalı girilmiş / Çift capture senaryosu" />
                        </div>
                        <EnterpriseButton variant="primary" type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white !h-8 text-xs font-bold border-rose-700">Düzeltme Uygula (Ters Kayıt)</EnterpriseButton>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="Son Uygulanan Düzeltme Kayıtları (Corrections)" />

                        {corrections.map(c => (
                            <div key={c.id} className="mb-4 bg-white border border-slate-200 rounded p-4 shadow-sm relative">
                                <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">CORRECTION</span>
                                <h6 className="font-mono text-sm font-bold text-slate-800">{c.id} | Ori: {c.originalEntryId}</h6>
                                <p className="text-xs text-slate-500 mt-1">{c.createdAt.toLocaleString()} • {c.tenantId}</p>
                                <p className="text-xs bg-slate-50 p-2 my-2 border border-slate-100 rounded text-slate-700"><strong>Gerekçe:</strong> {c.reason}</p>

                                <div className="mt-3">
                                    <table className="w-full text-[10px]">
                                        <thead><tr className="border-b bg-slate-100"><th className="text-left p-1">HESAP ID</th><th className="text-right p-1">BORÇ (DR)</th><th className="text-right p-1">ALACAK (CR)</th></tr></thead>
                                        <tbody>
                                            {c.lines.map(l => (
                                                <tr key={l.id} className="border-b last:border-0 border-slate-50"><td className="p-1 font-mono text-slate-500">{l.accountId}</td><td className="text-right p-1">{Number(l.debit)}</td><td className="text-right p-1">{Number(l.credit)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                        {corrections.length === 0 && (
                            <div className="text-sm bg-slate-50 p-4 border border-slate-100 text-slate-500 text-center rounded">Sisteme atılmış düzeltme kaydı yok.</div>
                        )}
                    </EnterpriseCard>
                </div>

            </div>
        </EnterprisePageShell>
    );
}
