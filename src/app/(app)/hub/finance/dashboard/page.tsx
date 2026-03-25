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
            <div className="bg-slate-50  min-h-screen pb-16 w-full font-sans flex items-center justify-center">
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
        <div className="bg-slate-50  min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubFinanceTabs />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-600 " />
                            Finans & Büyüme (Growth) Paneli
                        </h1>
                        <p className="text-[13px] text-slate-500  mt-1.5 max-w-4xl">
                            Periodya B2B ağındaki finansal performansınızı, Escrow cüzdan bakiyelerinizi, Boost bütçelerinizi ve ağdaki Güven Skorunuzu merkezi olarak tek ekrandan yönetin.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Finance / Escrow Wallet Analytics */}
                    <Link href="/hub/finance" className="bg-emerald-50/50  px-5 py-4 rounded-xl border border-emerald-100  shadow-sm flex items-center gap-4 hover:border-emerald-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-emerald-100  rounded-lg flex items-center justify-center text-emerald-600  shrink-0 group-hover:bg-emerald-200 :bg-emerald-500/30 transition-colors">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-emerald-600/70  uppercase tracking-widest mb-0.5">Ağ İçi Çekilebilir Bakiye</div>
                            <div className="text-lg font-black text-emerald-700  leading-none">
                                {availableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                <span className="text-xs font-semibold text-emerald-600/70 ml-1">Blokeli: {pendingBalance.toLocaleString('tr-TR')} ₺</span>
                            </div>
                        </div>
                    </Link>

                    {/* Boost Analytics */}
                    <Link href="/seller/boost" className="bg-white  px-5 py-4 rounded-xl border border-slate-200  shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-blue-50  rounded-lg flex items-center justify-center text-blue-600  shrink-0 group-hover:bg-blue-100 :bg-blue-500/20 transition-colors">
                            <BarChart className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Aktif Growth / Boost Opt.</div>
                            <div className="text-lg font-black text-slate-900  leading-none">Açık <span className="text-xs font-semibold text-slate-500 ml-1">Statü: Hazır</span></div>
                        </div>
                    </Link>

                    {/* Trust Score Analytics */}
                    <Link href="/hub/trust-score" className="bg-white  px-5 py-4 rounded-xl border border-slate-200  shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-indigo-50  rounded-lg flex items-center justify-center text-indigo-600  shrink-0 group-hover:bg-indigo-100 :bg-indigo-500/20 transition-colors">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">B2B Network Trust Skoru</div>
                            <div className="text-lg font-black text-slate-900  leading-none">
                                <span className={trustScore >= 80 ? 'text-emerald-500' : trustScore >= 50 ? 'text-amber-500' : 'text-red-500'}>
                                    {trustScore}
                                </span>
                                <span className="text-xs font-semibold text-slate-500 ml-1">/ 100 ({trustScore >= 80 ? 'Tier A+' : trustScore >= 50 ? 'Tier B' : 'Riskli'})</span>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="bg-slate-100  border border-slate-200  rounded-2xl p-8 text-center mt-4">
                     <p className="text-slate-500  max-w-lg mx-auto mb-6 text-sm">
                         Periodya B2B ağında yaptığınız tüm satışlardan doğan hakedişleriniz B2B Finance merkezi üzerinde toplanır. Rekabetçi kalabilmek için Growth panellerinden görünürlüğünüzü esnekçe artırabilirsiniz.
                     </p>
                     <div className="flex flex-wrap items-center justify-center gap-4">
                         <Link href="/hub/finance" className="px-5 py-2.5 bg-slate-900 text-white   shadow font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 transition">Cüzdan Hareketleri</Link>
                     </div>
                </div>
            </div>
        </div>
    );
}
