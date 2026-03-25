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
            <div className="bg-slate-50  min-h-screen pb-16 w-full font-sans flex items-center justify-center">
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
        prisma.sellerOffer.count({
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
        <div className="bg-slate-50  min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubOrdersTabs />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600 " />
                            Talepler & Sipariş Yönetim Paneli
                        </h1>
                        <p className="text-[13px] text-slate-500  mt-1.5 max-w-4xl">
                            Periodya B2B Güven Ağı üzerindeki tüm tedarik ve pazarlama operasyonlarınızın birleştirilmiş kokpiti. Gelen talepleri yanıtlayın, siparişleri kargolayın ve verdiğiniz siparişleri takip edin.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* RFQ Analytics */}
                    <Link href="/seller/rfqs" className="bg-white  px-5 py-4 rounded-xl border border-slate-200  shadow-sm flex items-center gap-4 hover:border-indigo-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-amber-50  rounded-lg flex items-center justify-center text-amber-600  shrink-0 group-hover:bg-amber-100 :bg-amber-500/20 transition-colors">
                            <Inbox className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cevap Bekleyen Talepler</div>
                            <div className="text-lg font-black text-slate-900  leading-none">{pendingRfqs} <span className="text-xs font-semibold text-slate-500 ml-1">Kabul Edilen: {acceptedRfqs}</span></div>
                        </div>
                    </Link>

                    {/* Sales Orders */}
                    <Link href="/hub/seller/orders" className="bg-emerald-50/50  px-5 py-4 rounded-xl border border-emerald-100  shadow-sm flex items-center gap-4 hover:border-emerald-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-emerald-100  rounded-lg flex items-center justify-center text-emerald-600  shrink-0 group-hover:bg-emerald-200 :bg-emerald-500/30 transition-colors">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-emerald-600/70  uppercase tracking-widest mb-0.5">Alınan Siparişler (Yeni)</div>
                            <div className="text-lg font-black text-emerald-700  leading-none">{newSalesOrders} <span className="text-xs font-semibold text-emerald-600/70 ml-1">Hazırlanan: {shippedSalesOrders}</span></div>
                        </div>
                    </Link>

                    {/* Purchase Orders */}
                    <Link href="/hub/buyer/orders" className="bg-white  px-5 py-4 rounded-xl border border-slate-200  shadow-sm flex items-center gap-4 hover:border-blue-500/30 transition-colors group">
                        <div className="w-10 h-10 bg-blue-50  rounded-lg flex items-center justify-center text-blue-600  shrink-0 group-hover:bg-blue-100 :bg-blue-500/20 transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Açık Siparişler (İşlemde)</div>
                            <div className="text-lg font-black text-slate-900  leading-none">{newPurchaseOrders} <span className="text-xs font-semibold text-slate-500 ml-1">Onaylanan: {paidPurchaseOrders}</span></div>
                        </div>
                    </Link>
                </div>

                <div className="bg-slate-100  border border-slate-200  rounded-2xl p-8 text-center mt-4">
                     <p className="text-slate-500  max-w-lg mx-auto mb-6 text-sm">
                         Yukarıdaki sekmeleri kullanarak Periodya B2B ağında gerçekleştirdiğiniz işlemler arasında anında geçiş yapabilirsiniz. Sipariş & Tekliflerinizi tek sekmeden yönetin.
                     </p>
                     <div className="flex flex-wrap items-center justify-center gap-4">
                         <Link href="/seller/rfqs" className="px-5 py-2.5 bg-white  text-slate-800  shadow font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition border border-slate-200 ">Müzakereleri İncele</Link>
                         <Link href="/hub/seller/orders" className="px-5 py-2.5 bg-indigo-600 text-white shadow font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition">Satışları Yönet</Link>
                     </div>
                </div>
            </div>
        </div>
    );
}
