import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HubPurchasingTabs from "@/components/network/HubPurchasingTabs";
import { FileSignature } from "lucide-react";

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
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubPurchasingTabs />
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileSignature className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Kurumsal Tedarik Sözleşmeleri
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-4xl">
                            B2B ağındaki satıcılarla yapılan uzun vadeli alım antlaşmaları, özel baremler ve periyodik abonelikler.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden lg:flex bg-white dark:bg-[#1e293b] p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 shrink-0">
                            <div className="px-4 py-1.5 flex flex-col items-center justify-center border-r border-slate-100 dark:border-white/5">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Aktif</span>
                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">{activeContractsCount}</span>
                            </div>
                            <div className="px-4 py-1.5 flex flex-col items-center justify-center border-r border-slate-100 dark:border-white/5">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Bekleyen</span>
                                <span className="text-base font-black text-amber-600 dark:text-amber-400 leading-none mt-0.5">{pendingContractsCount}</span>
                            </div>
                            <div className="px-4 py-1.5 flex flex-col items-center justify-center">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Periyodik</span>
                                <span className="text-base font-black text-blue-600 dark:text-blue-400 leading-none mt-0.5">{totalRecurring}</span>
                            </div>
                        </div>

                        <Link
                            href="/catalog"
                            className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors shadow-sm"
                        >
                            Kataloğa Dön
                        </Link>
                        <button
                            className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-sm gap-2"
                        >
                            <span>📑</span> Yeni Taslak Hazırla
                        </button>
                    </div>
                </div>

                {/* Ana Tablo Konteyner */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1e293b]/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sözleşme Sicil Tablosu</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">İmza sürecindeki veya yürürlükte olan fiyat ve miktar taahhütleri.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
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
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-[#1e293b] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                                                🤝
                                            </div>
                                            <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Kayıtlı Sözleşme Yok</p>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                                                Henüz herhangi bir tedarikçi ile B2B üzerinden bağlayıcı sözleşme imzalamadınız.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    contractsEnhanced.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-slate-50 dark:bg-[#1e293b] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white font-mono text-[14px] uppercase">
                                                    CTR-{c.id.slice(-6)}
                                                </div>
                                                <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                    {new Date(c.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {c.sellerName}
                                                </div>
                                                <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">ID: {c.sellerCompanyId.slice(0, 8)}...</div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center h-7 px-3 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-md font-mono text-[13px] font-bold text-slate-700 dark:text-slate-300">
                                                    {c.items.length} Kalem
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {c.recurringOrders.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[12px] font-bold uppercase tracking-widest border border-blue-200">
                                                        <span className="animate-pulse">🔄</span> Aktif ({c.recurringOrders.length})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2.5 py-1 rounded bg-slate-50 dark:bg-[#1e293b] text-slate-400 text-[12px] font-bold uppercase tracking-widest border border-slate-200 dark:border-white/5">
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
                                                    className="inline-flex items-center justify-center h-8 px-4 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[13px] font-semibold rounded-lg hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
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
