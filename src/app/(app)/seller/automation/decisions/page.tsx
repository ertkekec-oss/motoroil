import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
require('dayjs/locale/tr');
dayjs.locale('tr');

export const dynamic = "force-dynamic";

export default async function AutomationDecisionsPage() {
    const session: any = await getSession();
    const user = session?.user || session;
    if (!user) redirect("/login");

    const companyId = user.companyId;
    if (!companyId) redirect("/403");

    const logs = await prisma.automationDecisionLog.findMany({
        where: { sellerCompanyId: companyId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
            company: false // Product might not be directly linkable if variantId is loosely coupled, but variantId holds productId here
        }
    });

    // Since variantId holds productId in our implementation
    const productIds = logs.map(l => l.variantId).filter(Boolean) as string[];
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, code: true }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Karar Günlüğü (Decision Log)</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Zeka motorunun ürünleriniz için aldığı şeffaf kararlar ve gerekçeleri.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/seller/suggestions" className="text-sm font-medium text-[#1F3A5F] border px-4 py-2 rounded-lg bg-white hover:bg-slate-50">
                            &larr; Önerilere Dön
                        </Link>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#1F3A5F] text-white">
                                <tr>
                                    <th className="p-4 font-semibold">Tarih</th>
                                    <th className="p-4 font-semibold">SKU / Ürün</th>
                                    <th className="p-4 font-semibold">Kural (Rule)</th>
                                    <th className="p-4 font-semibold">Karar (Decision)</th>
                                    <th className="p-4 font-semibold">Detay (Checks)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">
                                            Henüz bir karar kaydı bulunmuyor.
                                        </td>
                                    </tr>
                                ) : logs.map((log) => {
                                    const prod = log.variantId ? productMap.get(log.variantId) : null;
                                    const checks = log.checksJson as any;

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 whitespace-nowrap text-slate-500">
                                                {dayjs(log.createdAt).format("DD MMM YYYY HH:mm")}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-xs text-slate-500">{prod?.code || log.variantId || "N/A"}</div>
                                                <div className="font-medium text-slate-800">{prod?.name || "Bilinmeyen Ürün"}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold border">
                                                    {log.rule}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${log.decision === 'AUTO_APPLY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        log.decision === 'PREVIEW_ONLY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {log.decision}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-slate-500">
                                                <div className="flex flex-col gap-0.5 max-w-[200px] truncate">
                                                    {checks ? Object.entries(checks).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between items-center gap-2">
                                                            <span className="truncate" title={k}>{k}:</span>
                                                            <span className={v ? 'text-emerald-500 font-bold' : 'text-red-500'}>{String(v)}</span>
                                                        </div>
                                                    )) : "-"}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
