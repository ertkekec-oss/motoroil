import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    const companyId = user.companyId || session?.companyId || session?.settings?.companyId;
    if (!companyId && user.role !== "SUPER_ADMIN" && user.role !== "admin" && user.role !== "OWNER") redirect("/403");

    const whereClause: any = { deletedAt: null };
    if (companyId) {
        whereClause.companyId = companyId;
    }

    // Fetch all products of this seller and their NetworkListings
    const products = await prisma.product.findMany({
        where: whereClause,
        include: {
            networkListings: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const listedCount = products.filter(p => p.networkListings.length > 0 && p.networkListings[0].status === 'ACTIVE').length;
    const pausedCount = products.filter(p => p.networkListings.length > 0 && p.networkListings[0].status !== 'ACTIVE').length;
    const unlistedCount = products.length - listedCount - pausedCount;

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubCatalogTabs />
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">
                            Katalog (Ürünlerim) / B2B Mağaza
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Lokal ERP deponuzdaki fiziksel ürünleri B2B global dağıtım ağına açın, fiyatlandırın ve listeleyin.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            className="h-10 px-5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm gap-2"
                        >
                            <span>+</span> Lokal Ürün Ekle
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Lokal ERP Toplam Ürün</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{products.length}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Ağda Satışta (Aktif)</p>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{listedCount}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Durdurulan İlanlar</p>
                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{pausedCount}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">B2B Ağına Kapalı</p>
                        <p className="text-3xl font-bold text-slate-400 dark:text-slate-500">{unlistedCount}</p>
                    </div>
                </div>

                {/* Ana Veri Tablosu */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Envanter Eşleştirme & Listeleme Tablosu</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Lokal ürün kartları ve B2B listeleme fiyatlarını buradan yönetin.</p>
                        </div>
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Barkod veya isim ara..."
                                className="w-full text-sm border border-slate-300 dark:border-white/20 rounded-lg px-4 py-2 bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/40 transition-all font-medium placeholder:text-slate-400 dark:text-slate-500 text-slate-900 dark:text-white shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/10 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Lokal Ürün Kodu</th>
                                    <th className="px-6 py-4 font-bold">Ürün Nitelik / Adı</th>
                                    <th className="px-6 py-4 font-bold text-center">Serbest Stok</th>
                                    <th className="px-6 py-4 font-bold text-right">Ağ Fiyatı (TRY)</th>
                                    <th className="px-6 py-4 font-bold text-center">Pazaryeri Statüsü</th>
                                    <th className="px-6 py-4 font-bold text-center">Bağlantı Türü</th>
                                    <th className="px-6 py-4 font-bold text-right">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[14px]">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                                            <div className="text-3xl mb-4">📦</div>
                                            <p className="text-[15px] font-semibold text-slate-900 dark:text-white">ERP Envanteri Boş</p>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">Şu anda lokal veritabanınızda eşlenik bir ürün bulunmuyor.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(p => {
                                        const listing = p.networkListings[0];
                                        const isListed = !!listing;

                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-[13px] text-slate-500 dark:text-slate-400">
                                                    <span className="px-2 py-0.5 border border-slate-200 dark:border-white/10 rounded text-slate-600 dark:text-slate-300 font-semibold bg-slate-50 dark:bg-[#0f172a]">
                                                        {p.code || p.id.slice(0, 8)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-[14px]">
                                                        {p.stock}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    {isListed ? (
                                                        <div className="font-mono font-bold text-[15px] text-slate-900 dark:text-white">
                                                            {Number(listing.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                            <span className="text-slate-400 dark:text-slate-500 text-[12px] ml-1">₺</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 font-bold italic">-</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    {isListed ? (
                                                        listing.status === 'ACTIVE' ? (
                                                            <span className="inline-flex px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                                                                Satışta
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-[11px] font-bold uppercase tracking-widest border border-amber-200 dark:border-amber-800">
                                                                Durduruldu
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex px-2.5 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest border border-slate-200 dark:border-white/10">
                                                            Yayında Değil
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    {isListed ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-[11px] font-bold text-blue-700 dark:text-blue-400 tracking-wide">
                                                            <span className="animate-pulse w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span> B2B SYNC
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wide">
                                                            LOCAL ONLY
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right align-middle">
                                                    <Link
                                                        href={`/seller/products/${p.id}`}
                                                        className={`inline-flex items-center justify-center h-8 px-4 border text-[13px] font-semibold rounded-lg transition-colors shadow-sm focus:outline-none ${isListed
                                                            ? 'bg-white dark:bg-[#0f172a] border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                                                            : 'bg-slate-900 dark:bg-blue-600 border-transparent text-white hover:bg-slate-800 dark:hover:bg-blue-500'
                                                            }`}
                                                    >
                                                        {isListed ? "Yönet / İncele" : "B2B'de Yayınla"}
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
