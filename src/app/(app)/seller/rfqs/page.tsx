import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText, Inbox, Clock, ChevronRight } from "lucide-react";
import HubOrdersTabs from "@/components/network/HubOrdersTabs";

export const dynamic = "force-dynamic";

export default async function SellerRfqsListPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const sellerCompanyId = user.companyId || session?.companyId;

    // Find all RFQs where this seller has an item and the RFQ is SENT or RESPONDED or ACCEPTED
    const rfqs = await prisma.rfq.findMany({
        where: {
            status: { in: ["SENT", "RESPONDED", "ACCEPTED"] },
            items: {
                some: { sellerCompanyId }
            }
        },
        include: {
            items: {
                where: { sellerCompanyId } // Only include THIS seller's requested items
            },
            offers: {
                where: { sellerCompanyId } // Only include THIS seller's offers
            }
        },
        orderBy: { updatedAt: "desc" }
    });

    const rfqsEnhanced = await Promise.all(rfqs.map(async (r: any) => {
        const buyer = await prismaRaw.company.findUnique({ where: { id: r.buyerCompanyId } });
        return {
            ...r,
            buyerName: buyer?.name || "Bilinmeyen Alıcı Firma"
        }
    }));

    return (
        <div className="bg-slate-50 min-h-screen  pb-16 w-full font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubOrdersTabs />
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                            <Inbox className="w-5 h-5 text-indigo-600 " />
                            Gelen İhaleler (Müzakereler)
                        </h1>
                        <p className="text-[13px] text-slate-500  mt-1.5 max-w-4xl">
                            Ağ alıcılarından size özel olarak yönlendirilen B2B teklif taleplerini inceleyin ve anında kendi rekabetçi faturanızı sunun.
                        </p>
                    </div>

                    <div className="flex bg-white  p-1.5 rounded-xl shadow-sm border border-slate-200  shrink-0">
                        <div className="px-4 py-1.5 flex flex-col items-center justify-center border-r border-slate-100 ">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Bekleyen</span>
                            <span className="text-base font-black text-amber-600  leading-none mt-0.5">{rfqsEnhanced.filter(r => r.offers.length === 0).length}</span>
                        </div>
                        <div className="px-4 py-1.5 flex flex-col items-center justify-center">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Toplam</span>
                            <span className="text-base font-black text-slate-800  leading-none mt-0.5">{rfqsEnhanced.length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white  rounded-2xl border border-slate-200  shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    {/* Hardened List View */}
                    <div className="overflow-x-auto custom-scrollbar flex-1 relative">
                        <table className="w-full text-left whitespace-nowrap border-collapse">
                            <thead className="bg-slate-50  text-slate-500  text-xs uppercase tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 ">REFERANS / TARİH</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200 ">ALICI FİRMA</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200  text-center">İSTENEN KALEM</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200  text-center">BENİM TEKLİFİM</th>
                                    <th className="px-6 py-4 font-bold border-b border-slate-200  text-right">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100  text-sm">
                                {rfqs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 ">
                                                <Inbox className="w-12 h-12 mb-4 opacity-50" />
                                                <p className="font-semibold text-base mb-1">Cevap Bekleyen İhale Yok</p>
                                                <p className="text-xs">Şu an için ağ üzerinden işletmenize yönlendirilmiş aktif bir teklif talebi bulunmuyor.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rfqsEnhanced.map((r: any) => {
                                        const myOffer = r.offers[0]; // Assuming one offer per seller per RFQ
                                        const dateLabel = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(r.createdAt));
                                        
                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50 :bg-white/[0.02] transition-colors group cursor-pointer relative">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!myOffer ? 'bg-amber-100  text-amber-600 ' : 'bg-slate-100  text-slate-500 '}`}>
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900  uppercase tracking-wider">
                                                                RFQ-{r.id.slice(-6).toUpperCase()}
                                                            </div>
                                                            <div className="text-xs text-slate-500  flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-3 h-3" /> {dateLabel}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-800  truncate max-w-[280px]">
                                                        {r.buyerName}
                                                    </div>
                                                    <div className="text-xs text-slate-400">Network B2B Alıcısı</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex px-2.5 py-1 text-xs font-bold bg-blue-50  text-blue-700  rounded-md border border-blue-100 ">
                                                        {r.items.length} Kalem
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {!myOffer ? (
                                                        <span className="inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-amber-100  text-amber-700  rounded border border-amber-200 ">
                                                            Puanlamadı / Bekliyor
                                                        </span>
                                                    ) : myOffer.status === 'ACCEPTED' ? (
                                                        <span className="inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-emerald-100  text-emerald-700  rounded border border-emerald-200 ">
                                                            Kabul Edildi
                                                        </span>
                                                    ) : myOffer.status === 'COUNTERED' ? (
                                                        <span className="inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-indigo-100  text-indigo-700  rounded border border-indigo-200 ">
                                                            Fiyat Verildi
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest bg-slate-200  text-slate-600  rounded border border-slate-300 ">
                                                            {myOffer.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/seller/rfqs/${r.id}`}
                                                        className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900  hover:bg-slate-800 :bg-slate-100 text-white  text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        {!myOffer ? 'Teklif Ver' : 'İncele'}
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
