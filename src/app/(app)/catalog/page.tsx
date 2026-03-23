import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";

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
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubCatalogTabs />
                
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
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-4 mb-10 flex flex-col sm:flex-row gap-4 items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                    <div className="relative w-full sm:w-96 flex-shrink-0 z-10">
                        <input
                            type="text"
                            placeholder="Marka, kategori, isim veya SKU ile arayın..."
                            className="w-full text-sm border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-slate-400 dark:text-slate-500 text-slate-800 dark:text-slate-200"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">🔍</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 z-10 shrink-0">
                        <button className="px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap">
                            Kategorileri Gör
                        </button>
                        <button className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-[13px] font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors whitespace-nowrap border border-slate-200 dark:border-white/5">
                            Filtrele
                        </button>
                    </div>
                </div>

                {/* Bölüm 1: Premium Görselli Kartlar (4 Kolon, max 12) */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center">✨</span>
                            Öne Çıkan Katalog Ürünleri
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(() => {
                            const itemsWithImages = items.filter(t => t.product.imageUrl || t.product.images?.length > 0 || t.product.image || t.product.coverImage || t.product.thumbnail).slice(0, 12);
                            
                            // If DB magically has no images, mock a few just to show the UI as requested
                            const renderItems = itemsWithImages.length > 0 ? itemsWithImages : items.slice(0, 8);
                            
                            if (renderItems.length === 0) {
                                return <div className="col-span-full py-10 text-slate-500 text-center border border-dashed rounded-2xl dark:border-white/10">Bu havuzda henüz ürün bulunmuyor.</div>;
                            }

                            return renderItems.map((item, idx) => {
                                const imgSafe = item.product.imageUrl || item.product.image || (item.product.images && item.product.images[0]) || item.product.coverImage || item.product.thumbnail || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2000&auto=format&fit=crop";
                                return (
                                <div key={idx} className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all group overflow-hidden flex flex-col">
                                    <div className="relative aspect-[4/3] bg-slate-100 dark:bg-[#0f172a] overflow-hidden">
                                        <img src={imgSafe} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-white/10 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            {item.availableQty} STOK
                                        </div>
                                        <div className="absolute bottom-3 left-3 bg-indigo-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                                            {item.sellersCount} SATICI
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-1.5 truncate">
                                            {item.product.category || 'Genel Kategori'}
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 mb-3">
                                            {item.product.name}
                                        </h3>
                                        
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-end justify-between">
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">En İyi Fiyat</div>
                                                <div className="text-lg font-black text-slate-900 dark:text-white">
                                                    {item.minPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}<span className="text-sm text-slate-400 outline-none">₺</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-5">
                                            <Link href={`/catalog/${item.product.id}`} className="flex items-center justify-center py-2.5 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                İncele
                                            </Link>
                                            <button className="flex items-center justify-center py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
                                                Sepete Ekle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )});
                        })()}
                    </div>
                </div>

                {/* Bölüm 2: Görselsiz Ürünler (2 Kolon, Şık Liste) */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center justify-center">📋</span>
                            Endüstriyel Parça İndeksi (Görselsiz)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(() => {
                            const itemsWithoutImages = items.filter(t => !(t.product.imageUrl || t.product.images?.length > 0 || t.product.image || t.product.coverImage || t.product.thumbnail)).slice(0, 8);
                            
                            const renderList = itemsWithoutImages.length > 0 ? itemsWithoutImages : items.slice(0, 8); // Fallback so grid doesn't stay empty if all have images
                            
                            if (renderList.length === 0) return null;

                            return renderList.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#1e293b] p-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors flex items-center gap-4 group">
                                    <div className="w-16 h-16 shrink-0 bg-slate-100 dark:bg-[#0f172a] rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/5">
                                        <span className="text-2xl opacity-50">📦</span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-white truncate pr-4">
                                            {item.product.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase font-bold tracking-wider truncate max-w-[120px]">
                                                {item.product.category || 'GENEL'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                ID: {item.product.id.slice(0, 6)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0 px-4 border-l border-slate-100 dark:border-white/5">
                                        <div className="text-sm font-black text-slate-900 dark:text-white">
                                            {item.minPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}<span className="text-xs text-slate-400 px-0.5">₺</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-emerald-500 mt-0.5">{item.availableQty} STOK</div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 shrink-0 pl-2">
                                        <button className="h-7 px-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap border border-indigo-100 dark:border-indigo-500/20">
                                            Sepet
                                        </button>
                                        <Link href={`/catalog/${item.product.id}`} className="h-7 px-3 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors uppercase tracking-widest whitespace-nowrap">
                                            İncele
                                        </Link>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
