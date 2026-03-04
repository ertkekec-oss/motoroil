import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: { q?: string } }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const SHOW_OOS = process.env.CATALOG_SHOW_OUT_OF_STOCK === "true";
    const HIDE_LT_MIN = process.env.CATALOG_HIDE_IF_AVAILABLE_LT_MINQTY !== "false"; // Default true

    // Query active network listings joined with their APPROVED GlobalProduct
    const listings = await prisma.networkListing.findMany({
        where: {
            status: "ACTIVE",
            globalProduct: {
                status: "APPROVED" // Only approved products in catalog
            },
            // If we are NOT showing out of stock, enforce availableQty > 0
            // More strict minQty check handled in JS loop for better precision
            // ...(SHOW_OOS ? {} : { availableQty: { gt: 0 } }) // TS Issue workaround -> Prisma does not perfectly handle conditional where spread with relation. We filter it anyway in map.
            ...(SHOW_OOS ? {} : { availableQty: { gt: 0 } })
        },
        include: {
            globalProduct: true,
        },
    });

    // Group by GlobalProduct
    const catalogMap = new Map<string, { product: any; minPrice: number; maxPrice: number; sellersCount: number; availableQty: number }>();

    for (const listing of listings) {
        if (!listing.globalProduct) continue;

        // Post-fetch gating: Hide if available < minQty unless SHOW_OOS is on
        if (!SHOW_OOS && HIDE_LT_MIN && listing.availableQty < listing.minQty) {
            continue;
        }

        const gId = listing.globalProduct.id;
        const p = Number(listing.price);
        const qty = listing.availableQty;

        if (catalogMap.has(gId)) {
            const entry = catalogMap.get(gId)!;
            entry.minPrice = Math.min(entry.minPrice, p);
            entry.maxPrice = Math.max(entry.maxPrice, p);
            entry.sellersCount += 1;
            entry.availableQty += qty;
        } else {
            catalogMap.set(gId, {
                product: listing.globalProduct,
                minPrice: p,
                maxPrice: p,
                sellersCount: 1,
                availableQty: qty,
            });
        }
    }

    const items = Array.from(catalogMap.values());

    return (
        <div className="bg-slate-50 dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">
                            B2B Tedarik Kataloğu <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 tracking-widest uppercase">Global Ağ</span>
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Pazaryerindeki onaylı tedarikçilerin stoklarında bulunan ve anında sipariş edilebilir hazır ürünler tablosu.
                        </p>
                    </div>

                    <div className="flex bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden p-1 shrink-0">
                        <Link
                            href="/catalog"
                            className="px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-sm"
                        >
                            Tüm Lüks Konsorsiyum Ağı
                        </Link>
                    </div>
                </div>

                {/* Filtre Strip */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Marka, kod, isim veya SKU ile arayın..."
                            className="w-full text-sm border border-slate-300 dark:border-white/20 rounded-lg px-4 py-2 bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/10/20 focus:border-slate-900 dark:focus:border-white/40 transition-all font-medium placeholder:text-slate-400 dark:text-slate-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">🔍</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-[13px] font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm">
                            Filtreyi Uygula
                        </button>
                        <button className="px-5 py-2 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 text-[13px] font-semibold rounded-lg hover:bg-slate-50 dark:bg-[#0f172a] transition-colors shadow-sm bg-white dark:bg-[#0f172a]">
                            Kategori Seç
                        </button>
                    </div>
                </div>

                {/* Ana Veri Tablosu */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]/50 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Endüstriyel Parça İndeksi</h2>
                        <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 bg-slate-200/50 text-[12px] font-bold text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                            {items.length} Kayıt
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/10 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Referans / Barkod</th>
                                    <th className="px-6 py-4 font-bold">Ürün Tanımı</th>
                                    <th className="px-6 py-4 font-bold text-right">Maliyet Bandı (TRY)</th>
                                    <th className="px-6 py-4 font-bold text-center">Tedarikçi Kapasitesi</th>
                                    <th className="px-6 py-4 font-bold text-center">Stok Havuzu</th>
                                    <th className="px-6 py-4 font-bold text-center">Operasyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[14px]">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                                            <div className="text-3xl mb-4">🏪</div>
                                            <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Katalog Boş</p>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">Platform üzerinde aktif satışta olan ürün kaydı bulunumadı.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:bg-[#0f172a] transition-colors group">
                                            <td className="px-6 py-4 font-mono text-[13px] text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0f172a] group-hover:bg-slate-50 dark:bg-[#0f172a]">
                                                <span className="px-2 py-0.5 border border-slate-200 dark:border-white/10 rounded text-slate-600 dark:text-slate-300 font-semibold bg-slate-50 dark:bg-[#0f172a]">
                                                    {item.product.barcode || item.product.id.slice(0, 8)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">{item.product.name}</div>
                                                <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{item.product.category || 'Genel Kategori'}</div>
                                            </td>

                                            <td className="px-6 py-4 font-mono font-semibold text-right text-[15px] text-slate-900 dark:text-white">
                                                {item.minPrice === item.maxPrice
                                                    ? item.minPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    : `${item.minPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} - ${item.maxPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                                                }
                                                <span className="text-slate-400 dark:text-slate-500 text-[12px] ml-1">₺</span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="text-slate-400 dark:text-slate-500">🏢</span> {item.sellersCount} Satıcı
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {item.availableQty > 0 ? (
                                                    <span className="inline-flex px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[12px] font-bold uppercase tracking-widest border border-emerald-200">
                                                        {item.availableQty} Adet
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2.5 py-1 rounded bg-red-100 text-red-800 text-[12px] font-bold uppercase tracking-widest border border-red-200">
                                                        Tükendi
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={`/catalog/${item.product.id}`}
                                                    className="inline-flex items-center justify-center h-8 px-4 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 text-[13px] font-semibold rounded-lg hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-colors shadow-sm"
                                                >
                                                    İncele
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]/50 flex items-center justify-between">
                        <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                            Sayfa 1 / 1
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
