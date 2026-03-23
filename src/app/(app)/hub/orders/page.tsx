import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HubOrdersTabs from "@/components/network/HubOrdersTabs";
import { BarChart3, Inbox, ShoppingCart, ShoppingBag, TrendingUp, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HubOrdersDashboard() {
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
        pendingRfqs, 
        acceptedRfqs,
        newSalesOrders,
        shippedSalesOrders,
        newPurchaseOrders,
        paidPurchaseOrders
    ] = await Promise.all([
        // Bekleyen gelen ihaleler (Satıcının hiç teklif vermediği, ama kendisinden istenmiş ihaleler)
        prisma.rfq.count({
            where: {
                status: { in: ["SENT", "RESPONDED"] },
                items: { some: { sellerCompanyId: companyId } },
                offers: { none: { sellerCompanyId: companyId } }
            }
        }),
        // Kabul edilen ihaleler (Satıcının teklif verdiği ve Alıcının kabul ettiği ihaleler)
        prisma.rfqOffer.count({
            where: {
                sellerCompanyId: companyId,
                status: "ACCEPTED"
            }
        }),
        // Alınan yeni siparişler (Satıcının ürünlerini alanlar)
        prisma.networkOrder.count({
            where: {
                sellerCompanyId: companyId,
                status: "PENDING_PAYMENT"
            }
        }),
        // Hazırlanıyor/Kargolandı Alınan Siparişler
        prisma.networkOrder.count({
            where: {
                sellerCompanyId: companyId,
                status: "PAID"
            }
        }),
        // Verilen açık siparişler (Alıcının şirketi olduğu, henüz teslim edilmemiş)
        prisma.networkOrder.count({
            where: {
                buyerCompanyId: companyId,
                status: "PENDING_PAYMENT"
            }
        }),
        // Ödemesi yapılmış, Teslim bekleyen Açık Siparişler
        prisma.networkOrder.count({
            where: {
                buyerCompanyId: companyId,
                status: "PAID"
            }
        })
    ]);

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubOrdersTabs />

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        Talepler & Sipariş Yönetim Paneli
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                        Periodya B2B Güven Ağı üzerindeki tüm tedarik ve pazarlama operasyonlarınızın birleştirilmiş kokpiti. Gelen talepleri yanıtlayın, siparişleri kargolayın ve verdiğiniz siparişleri takip edin.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* RFQ Analytics */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <Inbox className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-500/20">
                                <TrendingUp className="w-3 h-3" /> Aktif
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1 uppercase tracking-wider">Cevap Bekleyen Talepler</h3>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-4xl font-[900] tracking-tight text-slate-900 dark:text-white">{pendingRfqs}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Kabul Edilen Fiyatlarınız</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{acceptedRfqs}</span>
                                </div>
                                <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1"></div>
                                <Link href="/seller/rfqs" className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline">
                                    Gelen Müzakerelere Git &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Sales Orders Analytics */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            {newSalesOrders > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded uppercase tracking-wider border border-rose-100 dark:border-rose-500/20">
                                    <AlertCircle className="w-3 h-3" /> İşlem Bekliyor
                                </span>
                            )}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1 uppercase tracking-wider">Alınan Siparişler (Satış)</h3>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-4xl font-[900] tracking-tight text-slate-900 dark:text-white">{newSalesOrders}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Hazırlanan / Yoldaki Siparişler</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{shippedSalesOrders}</span>
                                </div>
                                <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1"></div>
                                <Link href="/hub/seller/orders" className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                                    Satış Siparişlerine Git &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Orders Analytics */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3 h-3" /> Süreçte
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-1 uppercase tracking-wider">Açık Siparişler (Alış)</h3>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-4xl font-[900] tracking-tight text-slate-900 dark:text-white">{newPurchaseOrders}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Onaylanan & Hazırlanan</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{paidPurchaseOrders}</span>
                                </div>
                                <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1"></div>
                                <Link href="/hub/buyer/orders" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
                                    Alış Siparişlerine Git &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center mt-4">
                     <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-6 text-sm">
                         Yukarıdaki sekmeleri kullanarak Periodya B2B ağında gerçekleştirdiğiniz işlemler arasında anında geçiş yapabilirsiniz. Sipariş & Tekliflerinizi tek sekmeden yönetin.
                     </p>
                     <div className="flex flex-wrap items-center justify-center gap-4">
                         <Link href="/seller/rfqs" className="px-5 py-2.5 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white shadow font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition border border-slate-200 dark:border-white/10">Müzakereleri İncele</Link>
                         <Link href="/hub/seller/orders" className="px-5 py-2.5 bg-indigo-600 text-white shadow font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition">Satışları Yönet</Link>
                     </div>
                </div>
            </div>
        </div>
    );
}
