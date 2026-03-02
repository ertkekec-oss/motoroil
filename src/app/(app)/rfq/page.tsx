import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// B2B 9-10 Level Premium Semantic Color System Status Badge
function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { label: string, colorClass: string }> = {
        DRAFT: { label: "Taslak", colorClass: "bg-slate-100 text-slate-600" },
        PUBLISHED: { label: "Teklif Bekliyor", colorClass: "bg-amber-100 text-amber-700" },
        NEGOTIATING: { label: "Müzakere", colorClass: "bg-blue-100 text-blue-700" },
        ACCEPTED: { label: "Kabul Edildi", colorClass: "bg-emerald-100 text-emerald-700" },
        REJECTED: { label: "Reddedildi", colorClass: "bg-red-100 text-red-700" },
        EXPIRED: { label: "Süresi Doldu", colorClass: "bg-red-100 text-red-700" }
    };

    const s = statusMap[status] || { label: status, colorClass: "bg-slate-100 text-slate-600" };

    return (
        <span className={`inline-flex px-2 py-1 text-[11px] font-bold uppercase tracking-widest rounded ${s.colorClass}`}>
            {s.label}
        </span>
    );
}

export default async function BuyerRfqListPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const buyerCompanyId = user.companyId || session?.companyId;

    const rfqs = await prisma.rfq.findMany({
        where: { buyerCompanyId },
        include: {
            items: true,
            offers: true,
        },
        orderBy: { createdAt: "desc" }
    });

    const activeRfqsCount = rfqs.filter(r => r.status === 'PUBLISHED' || r.status === 'NEGOTIATING').length;

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                            Özel Fiyat Teklifleri (RFQ)
                        </h1>
                        <p className="text-sm text-slate-600">
                            B2B ağındaki tedarikçilerden toplu alım ve ihale usulü fiyat teklifi (Request For Quotation) süreçlerini yönetin.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/catalog"
                            className="h-10 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                        >
                            Kataloğa Dön
                        </Link>
                        <button
                            className="h-10 px-5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm gap-2"
                        >
                            <span>+</span> Yeni İhale / RFQ Oluştur
                        </button>
                    </div>
                </div>

                {/* Stat Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Toplam İhale (RFQ)</p>
                        <p className="text-3xl font-bold text-slate-900">{rfqs.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Aktif Müzakere</p>
                        <p className="text-3xl font-bold text-blue-600">{activeRfqsCount}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Gelen Teklif</p>
                        <p className="text-3xl font-bold text-amber-600">
                            {rfqs.reduce((acc, r) => acc + r.offers.filter(o => o.status !== "REJECTED").length, 0)}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Onaylanan Alımlar</p>
                        <p className="text-3xl font-bold text-emerald-600">
                            {rfqs.filter(r => r.status === 'ACCEPTED').length}
                        </p>
                    </div>
                </div>

                {/* Ana Tablo Konteyner */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">RFQ Operasyon Tablosu</h2>
                            <p className="text-[13px] text-slate-500 mt-1">İhale ve teklif alma süreçlerinin detaylı listesi.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="bg-white border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                                <tr>
                                    <th className="px-6 py-4 font-bold">RFQ Referans / Tarih</th>
                                    <th className="px-6 py-4 font-bold text-center">Talep Edilen Kalem</th>
                                    <th className="px-6 py-4 font-bold text-center">Aktif Teklifler</th>
                                    <th className="px-6 py-4 font-bold">İhale Statüsü</th>
                                    <th className="px-6 py-4 font-bold text-right">Operasyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[14px]">
                                {rfqs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 shadow-sm">
                                                📝
                                            </div>
                                            <p className="text-[15px] font-semibold text-slate-900">Aktif RFQ Bulunmuyor</p>
                                            <p className="text-[13px] text-slate-500 max-w-sm mx-auto mt-1">
                                                Henüz herhangi bir ürüne ilişkin çoklu teklif talebi başlatmadınız. Özel fiyat almak için "Yeni RFQ" oluşturun.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    rfqs.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 font-mono text-[14px]">
                                                    RFQ-{r.id.slice(-6).toUpperCase()}
                                                </div>
                                                <div className="text-[12px] text-slate-500 mt-0.5 font-medium">
                                                    {new Date(r.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center h-7 px-3 bg-slate-50 border border-slate-200 rounded-md font-mono text-[13px] font-bold text-slate-700">
                                                    {r.items.length} Kalem
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center h-7 px-3 rounded-md font-mono text-[13px] font-bold border ${r.offers.some((o: any) => o.status !== "REJECTED") ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                                    {r.offers.filter((o: any) => o.status !== "REJECTED").length}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <StatusBadge status={r.status} />
                                            </td>

                                            <td className="px-6 py-4 text-right align-middle">
                                                <Link
                                                    href={`/rfq/${r.id}`}
                                                    className="inline-flex items-center justify-center h-8 px-4 bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold rounded-lg hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                >
                                                    Müzakereyi Yönet
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
