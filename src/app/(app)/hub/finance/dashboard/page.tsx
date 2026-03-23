import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HubFinanceTabs from "@/components/network/HubFinanceTabs";
import { PieChart, Wallet, ShieldCheck, ChevronRight, TrendingUp, BarChart } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HubFinanceDashboard() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const companyId = user.companyId || session?.companyId;

    if (!companyId) {
        return (
            <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans flex items-center justify-center">
                <div className="text-slate-500">Şirket bilginiz bulunamadı.</div>
            </div>
        );
    }

    // --- Analytics Queries ---
    const [
        trustScoreRecord,
        activeBoostCampaigns,
        ledgerAccount
    ] = await Promise.all([
        prisma.sellerTrustScore.findUnique({
            where: { sellerTenantId: companyId }
        }),
        prisma.networkListing.count({
            where: {
                sellerCompanyId: companyId,
                status: "ACTIVE",
                // Simulate boost campaigns by count or another field if available. Let's just find anything. We can mock for visual if there's no native Boost schema yet.
            }
        }),
        prisma.ledgerAccount.findUnique({
            where: { companyId: companyId }
        })
    ]);

    const trustScore = trustScoreRecord?.score || 100;
    const availableBalance = Number(ledgerAccount?.availableBalance || 0);
    const pendingBalance = Number(ledgerAccount?.pendingBalance || 0);

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubFinanceTabs />

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <PieChart className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        Finans & Büyüme (Growth) Paneli
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                        Periodya B2B ağındaki finansal performansınızı, Escrow cüzdan bakiyelerinizi, Boost bütçelerinizi ve ağdaki Güven Skorunuzu merkezi olarak tek ekrandan yönetin.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Finance / Escrow Wallet Analytics */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group col-span-1 lg:col-span-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                <TrendingUp className="w-3 h-3" /> Cüzdan
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1 uppercase tracking-wider">Ağ İçi Çekilebilir Bakiye</h3>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-4xl font-[900] tracking-tight text-slate-900 dark:text-white">
                                    {availableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-1">₺</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">B2B Escrow Blokeli Bakiye</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {pendingBalance.toLocaleString('tr-TR')} ₺
                                    </span>
                                </div>
                                <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1"></div>
                                <Link href="/hub/finance" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
                                    Varlık Yönetimi / Payout &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Boost Analytics */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group col-span-1 lg:col-span-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <BarChart className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                Growth (Motor)
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1 uppercase tracking-wider">Aktif Growth / Boost Opt.</h3>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-4xl font-[900] tracking-tight text-slate-900 dark:text-white">Açık</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Satış Performansı ve Analitik Özeti</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Hazır</span>
                                </div>
                                <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1"></div>
                                <Link href="/seller/boost" className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                    Boost Merkezine Git &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Trust Score Analytics */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group col-span-1 lg:col-span-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                Kredibilite
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1 uppercase tracking-wider">Network Trust Skoru</h3>
                            <div className="flex items-end gap-3 mb-4">
                                <span className={`text-4xl font-[900] tracking-tight ${trustScore >= 80 ? 'text-emerald-500' : trustScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {trustScore}
                                </span>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1.5">/ 100</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">B2B Ağ Kredibiliteniz</span>
                                    <span className={`font-bold ${trustScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {trustScore >= 80 ? 'Tier A+' : trustScore >= 50 ? 'Tier B' : 'Riskli'}
                                    </span>
                                </div>
                                <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1"></div>
                                <Link href="/hub/trust-score" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
                                    Puan Detaylarını İncele &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center mt-4">
                     <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-6 text-sm">
                         Periodya B2B ağında yaptığınız tüm satışlardan doğan hakedişleriniz B2B Finance merkezi üzerinde toplanır. Rekabetçi kalabilmek için Growth panellerinden görünürlüğünüzü esnekçe artırabilirsiniz.
                     </p>
                     <div className="flex flex-wrap items-center justify-center gap-4">
                         <Link href="/hub/finance" className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 transition">Cüzdan Hareketleri</Link>
                     </div>
                </div>
            </div>
        </div>
    );
}
