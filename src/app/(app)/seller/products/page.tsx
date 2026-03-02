import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    const companyId = user.companyId || session?.companyId || session?.settings?.companyId;
    if (!companyId && user.role !== "SUPER_ADMIN" && user.role !== "admin") redirect("/403");

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
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                            Katalog (Ürünlerim) / B2B Mağaza
                        </h1>
                        <p className="text-sm text-slate-600">
                            Lokal ERP deponuzdaki fiziksel ürünleri B2B global dağıtım ağına açın, fiyatlandırın ve listeleyin.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            className="h-10 px-5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm gap-2"
                        >
                            <span>+</span> Lokal Ürün Ekle
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lokal ERP Toplam Ürün</p>
                        <p className="text-3xl font-bold text-slate-900">{products.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ağda Satışta (Aktif)</p>
                        <p className="text-3xl font-bold text-emerald-600">{listedCount}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Durdurulan İlanlar</p>
                        <p className="text-3xl font-bold text-amber-600">{pausedCount}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">B2B Ağına Kapalı</p>
                        <p className="text-3xl font-bold text-slate-400">{unlistedCount}</p>
                    </div>
                </div>

                {/* Ana Veri Tablosu */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Envanter Eşleştirme & Listeleme Tablosu</h2>
                            <p className="text-[13px] text-slate-500 mt-1">Lokal ürün kartları ve B2B listeleme fiyatlarını buradan yönetin.</p>
                        </div>
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Barkod veya isim ara..."
                                className="w-full text-sm border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="bg-white border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wide">
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
                            <tbody className="divide-y divide-slate-100 text-[14px]">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                            <div className="text-3xl mb-4">📦</div>
                                            <p className="text-[15px] font-semibold text-slate-900">ERP Envanteri Boş</p>
                                            <p className="text-[13px] text-slate-500 max-w-sm mx-auto mt-1">Şu anda lokal veritabanınızda eşlenik bir ürün bulunmuyor.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(p => {
                                        const listing = p.networkListings[0];
                                        const isListed = !!listing;

                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-[13px] text-slate-500 bg-white group-hover:bg-slate-50">
                                                    <span className="px-2 py-0.5 border border-slate-200 rounded text-slate-600 font-semibold bg-slate-50">
                                                        {p.code || p.id.slice(0, 8)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900">{p.name}</div>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-bold text-slate-700 font-mono text-[14px]">
                                                        {p.stock}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    {isListed ? (
                                                        <div className="font-mono font-bold text-[15px] text-slate-900">
                                                            {Number(listing.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                            <span className="text-slate-400 text-[12px] ml-1">₺</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold italic">-</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    {isListed ? (
                                                        listing.status === 'ACTIVE' ? (
                                                            <span className="inline-flex px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-widest border border-emerald-200">
                                                                Satışta
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-widest border border-amber-200">
                                                                Durduruldu
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex px-2.5 py-1 rounded bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest border border-slate-200">
                                                            Yayında Değil
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    {isListed ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-700 tracking-wide">
                                                            <span className="animate-pulse w-1.5 h-1.5 bg-blue-600 rounded-full"></span> B2B SYNC
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide">
                                                            LOCAL ONLY
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right align-middle">
                                                    <Link
                                                        href={`/seller/products/${p.id}`}
                                                        className={`inline-flex items-center justify-center h-8 px-4 border text-[13px] font-semibold rounded-lg transition-colors shadow-sm focus:outline-none ${isListed
                                                            ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                                            : 'bg-slate-900 border-transparent text-white hover:bg-slate-800'
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
