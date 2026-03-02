import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// B2B 9-10 Level Premium Semantic Color System Status Badge
function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { label: string, colorClass: string }> = {
        DRAFT: { label: "Taslak", colorClass: "bg-slate-100 text-slate-600" },
        PENDING_REVIEW: { label: "İnceleniyor", colorClass: "bg-amber-100 text-amber-700" },
        ACTIVE: { label: "Aktif Sözleşme", colorClass: "bg-emerald-100 text-emerald-700" },
        EXPIRED: { label: "Süresi Doldu", colorClass: "bg-red-100 text-red-700" },
        CANCELLED: { label: "İptal Edildi", colorClass: "bg-slate-100 text-slate-600" },
        REVISE_REQUESTED: { label: "Revize Bekliyor", colorClass: "bg-amber-100 text-amber-700" },
    };

    const s = statusMap[status] || { label: status, colorClass: "bg-slate-100 text-slate-600" };

    return (
        <span className={`inline-flex px-2 py-1 text-[11px] font-bold uppercase tracking-widest rounded ${s.colorClass}`}>
            {s.label}
        </span>
    );
}

export default async function BuyerContractsPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const buyerCompanyId = user.companyId || session?.companyId;

    const contracts = await prisma.contract.findMany({
        where: { buyerCompanyId },
        include: {
            items: true,
            recurringOrders: true
        },
        orderBy: { createdAt: "desc" }
    });

    // Resolve seller names
    const contractsEnhanced = await Promise.all(
        contracts.map(async (c) => {
            const seller = await prisma.company.findUnique({ where: { id: c.sellerCompanyId } });
            return {
                ...c,
                sellerName: seller?.name || "Bilinmeyen Satıcı"
            };
        })
    );

    const activeContractsCount = contractsEnhanced.filter(c => c.status === 'ACTIVE').length;
    const pendingContractsCount = contractsEnhanced.filter(c => c.status === 'PENDING_REVIEW' || c.status === 'REVISE_REQUESTED').length;
    const totalRecurring = contractsEnhanced.reduce((acc, c) => acc + c.recurringOrders.length, 0);

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                            Kurumsal Tedarik Sözleşmeleri
                        </h1>
                        <p className="text-sm text-slate-600">
                            B2B ağındaki satıcılarla yapılan uzun vadeli alım antlaşmaları, özel baremler ve periyodik abonelikler.
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
                            <span>📑</span> Yeni Taslak Hazırla
                        </button>
                    </div>
                </div>

                {/* Stat Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Toplam Sözleşme</p>
                        <p className="text-3xl font-bold text-slate-900">{contractsEnhanced.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Aktif Antlaşmalar</p>
                        <p className="text-3xl font-bold text-emerald-600">{activeContractsCount}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Onay Bekleyen</p>
                        <p className="text-3xl font-bold text-amber-600">{pendingContractsCount}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Otomatik (Periyodik) Alım</p>
                        <p className="text-3xl font-bold text-blue-600">{totalRecurring} Plan</p>
                    </div>
                </div>

                {/* Ana Tablo Konteyner */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Sözleşme Sicil Tablosu</h2>
                            <p className="text-[13px] text-slate-500 mt-1">İmza sürecindeki veya yürürlükte olan fiyat ve miktar taahhütleri.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="bg-white border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Referans No / Tarih</th>
                                    <th className="px-6 py-4 font-bold">Tedarikçi Firma</th>
                                    <th className="px-6 py-4 font-bold text-center">Fiyata Bağlı Ürün</th>
                                    <th className="px-6 py-4 font-bold text-center">Periyodik Sipariş</th>
                                    <th className="px-6 py-4 font-bold">Hukuki Statü</th>
                                    <th className="px-6 py-4 font-bold text-right">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[14px]">
                                {contractsEnhanced.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 shadow-sm">
                                                🤝
                                            </div>
                                            <p className="text-[15px] font-semibold text-slate-900">Kayıtlı Sözleşme Yok</p>
                                            <p className="text-[13px] text-slate-500 max-w-sm mx-auto mt-1">
                                                Henüz herhangi bir tedarikçi ile B2B üzerinden bağlayıcı sözleşme imzalamadınız.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    contractsEnhanced.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 font-mono text-[14px] uppercase">
                                                    CTR-{c.id.slice(-6)}
                                                </div>
                                                <div className="text-[12px] text-slate-500 mt-0.5 font-medium">
                                                    {new Date(c.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">
                                                    {c.sellerName}
                                                </div>
                                                <div className="text-[12px] text-slate-500 mt-0.5">ID: {c.sellerCompanyId.slice(0, 8)}...</div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center h-7 px-3 bg-slate-50 border border-slate-200 rounded-md font-mono text-[13px] font-bold text-slate-700">
                                                    {c.items.length} Kalem
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {c.recurringOrders.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[12px] font-bold uppercase tracking-widest border border-blue-200">
                                                        <span className="animate-pulse">🔄</span> Aktif ({c.recurringOrders.length})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2.5 py-1 rounded bg-slate-50 text-slate-400 text-[12px] font-bold uppercase tracking-widest border border-slate-200">
                                                        Yok
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <StatusBadge status={c.status} />
                                            </td>

                                            <td className="px-6 py-4 text-right align-middle">
                                                <Link
                                                    href={`/contracts/${c.id}`}
                                                    className="inline-flex items-center justify-center h-8 px-4 bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold rounded-lg hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                >
                                                    Dosyaya Git
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
