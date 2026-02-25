import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BuySuggestionClient } from "./BuySuggestionClient";

export const dynamic = "force-dynamic";

export default async function BuyerRecommendationsPage() {
    const session: any = await getSession();
    const user = session?.user || session;
    if (!user) redirect("/login");

    const companyId = user.companyId;
    if (!companyId) redirect("/403");

    const suggestions = await prisma.buySuggestion.findMany({
        where: {
            buyerCompanyId: companyId,
            status: "OPEN"
        },
        orderBy: { daysRemaining: "asc" }
    });

    const products = await prisma.globalProduct.findMany({
        where: { id: { in: suggestions.map(s => s.globalProductId) } }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Query seller availability per global product (ignoring own)
    const activeListings = await prisma.networkListing.groupBy({
        by: ['globalProductId'],
        where: {
            globalProductId: { in: suggestions.map(s => s.globalProductId) },
            status: "ACTIVE",
            sellerCompanyId: { not: companyId }
        },
        _count: {
            sellerCompanyId: true
        }
    });

    const sellerCountMap = new Map(activeListings.map(n => [n.globalProductId, n._count.sellerCompanyId]));

    // KPIs
    const riskCount = suggestions.length;
    const convertedCount = await prisma.buySuggestion.count({
        where: { buyerCompanyId: companyId, status: "ORDERED" }
    });

    const avgWarningDaysSql = await prisma.buySuggestion.aggregate({
        _avg: { daysRemaining: true },
        where: { buyerCompanyId: companyId }
    });
    const avgWarningDays = avgWarningDaysSql._avg.daysRemaining ? Math.round(avgWarningDaysSql._avg.daysRemaining) : 0;

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Satın Alma Önerileri</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Tüketim hızınıza göre stoğu bitmek üzere olan ürünleriniz ve fırsatlar.
                        </p>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Riskteki Ürünler</div>
                        <div className="text-3xl font-extrabold text-[#1F3A5F] mt-2">{riskCount}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Siparişe Dönen Öneriler</div>
                        <div className="text-3xl font-extrabold text-emerald-600 mt-2">{convertedCount}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ortalama Erken Uyarı</div>
                        <div className="text-3xl font-extrabold text-blue-600 mt-2">{avgWarningDays} Gün</div>
                    </div>
                </div>

                {/* Suggestions List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestions.length === 0 ? (
                        <div className="col-span-full bg-white p-8 border border-slate-200 rounded-xl text-center text-[#1F3A5F] font-medium shadow-sm">
                            Şu an stoğu bitmek üzere olan veya risk taşıyan bir ürününüz yok. Harika!
                        </div>
                    ) : suggestions.map((s, idx) => {
                        const prod = productMap.get(s.globalProductId);
                        const sellerCount = sellerCountMap.get(s.globalProductId) || 0;
                        const hasSeller = sellerCount > 0;

                        return (
                            <div key={idx} className="bg-white border border-red-200 shadow-sm rounded-xl p-5 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{prod?.code || s.globalProductId}</div>
                                    <div className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 gap-1">
                                        ⚠️ Risk
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 truncate" title={prod?.name || "Bilinmeyen"}>
                                    {prod?.name || "Bilinmeyen Ürün"}
                                </h3>
                                <div className="text-sm text-slate-600 mb-4 h-10">
                                    Stoğunuz <strong className="text-black">~{Math.max(1, Math.round(s.daysRemaining))} gün</strong> içinde bitecek.
                                    Ağda <strong className="text-black">{sellerCount} satıcıda</strong> mevcut.
                                </div>

                                <BuySuggestionClient suggestionId={s.id} globalProductId={s.globalProductId} hasSeller={hasSeller} />
                            </div>
                        )
                    })}
                </div>

            </div>
        </div>
    )
}
