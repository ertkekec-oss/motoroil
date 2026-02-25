
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuggestionStatus, SuggestionType } from "@prisma/client";
import { acceptSuggestionAction, dismissSuggestionAction } from "@/actions/suggestionActions";
import Link from "next/link";
import { getAutomationMetrics } from "@/services/automation/automationMetricsService";

export const dynamic = "force-dynamic";

export default async function SellerSuggestionsPage() {
    const session: any = await getSession();
    const user = session?.user || session;
    if (!user) redirect("/login");

    const companyId = user.companyId;
    if (!companyId) redirect("/403");

    const suggestions = await prisma.b2BSuggestion.findMany({
        where: {
            sellerCompanyId: companyId,
            status: SuggestionStatus.OPEN
        },
        include: {
            product: true
        },
        orderBy: { score: "desc" }
    });

    const acceptedCount = await prisma.b2BSuggestion.count({
        where: {
            sellerCompanyId: companyId,
            status: { in: [SuggestionStatus.ACCEPTED, SuggestionStatus.AUTO_APPLIED] }
        }
    });

    // Real revenue and KPI from Phase D4
    const metrics = await getAutomationMetrics(companyId);

    const stats = [
        { label: "Yeni Öneriler", value: suggestions.length, color: "text-blue-600" },
        { label: "Uygulananlar", value: acceptedCount, color: "text-emerald-600" },
        { label: "Otomasyon Kazancı", value: `₺${metrics.automationRevenueWTD.toLocaleString('tr-TR')}`, color: "text-amber-600", suffix: " (Son 7 Gün)" },
        { label: "Oto. Sipariş", value: metrics.automationOrdersWTD, color: "text-purple-600" },
        { label: "Dönüşüm Oranı", value: `%${metrics.automationConversionRateWTD}`, color: "text-pink-600" }
    ];

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Zeka Önerileri</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Envanter ve satış verilerinize göre B2B performansınızı artıracak öneriler.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/seller/automation" className="text-sm font-medium text-[#1F3A5F] hover:underline">
                            Otomasyon Ayarları &rarr;
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.map((s, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</div>
                            <div className={`text-2xl font-black mt-1 ${s.color}`}>
                                {s.value}<span className="text-sm text-slate-400 font-normal ml-1">{s.suffix || ''}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {suggestions.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                            <div className="text-slate-400 mb-2">✨ Şu an için yeni bir öneri bulunmuyor.</div>
                            <p className="text-sm text-slate-500">Sistem verilerinizi analiz etmeye devam ediyor.</p>
                        </div>
                    ) : (
                        suggestions.map((sug) => (
                            <SuggestionCard key={sug.id} suggestion={sug} />
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}

function SuggestionCard({ suggestion }: { suggestion: any }) {
    const reasons = suggestion.reasonsJson as any;
    const typeLabel = {
        [SuggestionType.LIST]: "Yayınla",
        [SuggestionType.PAUSE]: "Durdur",
        [SuggestionType.FIX_LISTING]: "Eksik Tamamla",
        [SuggestionType.SET_PRICE]: "Fiyat Belirle",
        [SuggestionType.ADJUST_PRICE]: "Fiyat Güncelle",
        [SuggestionType.INCREASE_VISIBILITY]: "Görünürlük Artır"
    }[suggestion.suggestionType as SuggestionType];

    const typeColor = {
        [SuggestionType.LIST]: "bg-emerald-50 text-emerald-700 border-emerald-200",
        [SuggestionType.PAUSE]: "bg-amber-50 text-amber-700 border-amber-200",
        [SuggestionType.FIX_LISTING]: "bg-blue-50 text-blue-700 border-blue-200",
        [SuggestionType.SET_PRICE]: "bg-purple-50 text-purple-700 border-purple-200",
        [SuggestionType.ADJUST_PRICE]: "bg-indigo-50 text-indigo-700 border-indigo-200",
        [SuggestionType.INCREASE_VISIBILITY]: "bg-sky-50 text-sky-700 border-sky-200"
    }[suggestion.suggestionType as SuggestionType];

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-sm transition-shadow">
            {/* Score circle */}
            <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full border-4 border-slate-50 bg-slate-50 relative">
                <div className="text-lg font-bold text-[#1F3A5F]">{Math.round(suggestion.score)}</div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${typeColor}`}>
                        {typeLabel}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{suggestion.product?.code}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{suggestion.product?.name}</h3>
                <p className="text-sm text-slate-600 leading-snug">
                    {reasons.message || "Bu ürün için optimize edilmiş bir işlem öneriliyor."}
                </p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
                <form action={dismissSuggestionAction.bind(null, suggestion.id)}>
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-md transition-colors">
                        Yoksay
                    </button>
                </form>

                {(suggestion.suggestionType === SuggestionType.FIX_LISTING || suggestion.suggestionType === SuggestionType.SET_PRICE) ? (
                    <Link
                        href={suggestion.suggestionType === SuggestionType.SET_PRICE ? `/seller/products/${suggestion.productId}` : `/seller/products/${suggestion.productId}`}
                        className="px-6 py-2 text-sm font-bold bg-[#1F3A5F] text-white rounded-md hover:opacity-90 active:scale-95 transition-all shadow-sm block text-center"
                    >
                        Düzenle
                    </Link>
                ) : (
                    <form action={acceptSuggestionAction.bind(null, suggestion.id)}>
                        <button type="submit" className="px-6 py-2 text-sm font-bold bg-[#1F3A5F] text-white rounded-md hover:opacity-90 active:scale-95 transition-all shadow-sm">
                            Uygula
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
