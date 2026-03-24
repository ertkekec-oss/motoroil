import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";
import { Search, SlidersHorizontal, Globe } from "lucide-react";

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
    // FIX: Must use prismaRaw to bypass the row-level security / isolation that ordinarily filters out other tenants.
    const listings = await prismaRaw.networkListing.findMany({
        where: {
            status: "ACTIVE",
            globalProduct: {
                status: "APPROVED" // Only approved products in catalog
            },
            ...(SHOW_OOS ? {} : { availableQty: { gt: 0 } })
        },
        include: {
            globalProduct: true,
            erpProduct: true // Included to steal local images as fallback!
        },
    });

    // Group by GlobalProduct
    const catalogMap = new Map<string, { product: any; minPrice: number; maxPrice: number; sellersCount: number; availableQty: number; localFallbackImage: string | null }>();

    for (const listing of listings) {
        if (!listing.globalProduct) continue;

        if (!SHOW_OOS && HIDE_LT_MIN && listing.availableQty < listing.minQty) {
            continue;
        }

        const gId = listing.globalProduct.id;
        const p = Number(listing.price);
        const qty = listing.availableQty;
        
        // Extract seller's local image representation
        const ep = listing.erpProduct as any;
        let localImage = ep?.imageUrl || ep?.image || (ep?.images && ep.images[0]) || ep?.coverImage || ep?.thumbnail || null;

        if (catalogMap.has(gId)) {
            const entry = catalogMap.get(gId)!;
            entry.minPrice = Math.min(entry.minPrice, p);
            entry.maxPrice = Math.max(entry.maxPrice, p);
            entry.sellersCount += 1;
            entry.availableQty += qty;
            if (!entry.localFallbackImage && localImage) entry.localFallbackImage = localImage;
        } else {
            catalogMap.set(gId, {
                product: listing.globalProduct,
                minPrice: p,
                maxPrice: p,
                sellersCount: 1,
                availableQty: qty,
                localFallbackImage: localImage
            });
        }
    }

    const items = Array.from(catalogMap.values());

    // Fetch REAL categories from the database for the fast-filter menu
    const realCategories = await prismaRaw.globalCategory.findMany({
        take: 8,
        orderBy: { name: 'asc' }
    });

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] min-h-screen flex flex-col w-full font-sans">
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 flex-1">
                <HubCatalogTabs />
                
                {/* Header Title Area */}
                <div className="flex justify-between items-center mb-6 mt-4">
                     <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                         <Globe className="text-indigo-600 dark:text-indigo-400 w-5 h-5"/>
                         B2B Tedarik Kataloğu 
                         <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/10 text-indigo-500 font-bold uppercase tracking-widest border border-indigo-500/20">Global Ağ</span>
                     </h1>
                </div>

                {/* Desktop-optimized Aesthetic Centered Search & Filter Hub */}
                <div className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm mb-12 overflow-hidden">
                    {/* Top Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center p-2 gap-2">
                        <div className="relative flex-1 min-w-0">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-indigo-500/70" />
                            </div>
                            <input
                                type="text"
                                placeholder="Marka, referans no veya ürün kodu yazın..."
                                className="w-full h-12 pl-12 pr-4 bg-transparent border-none text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
                            />
                        </div>
                        
                        <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-white/10 mx-2 shrink-0"></div>
                        
                        <div className="flex items-center gap-2 pt-2 lg:pt-0 shrink-0 w-full lg:w-auto px-2 lg:px-0">
                            <button className="flex-1 lg:flex-none h-10 px-5 inline-flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] shadow-inner border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-[13px] font-semibold rounded-xl transition-all whitespace-nowrap gap-2">
                                <SlidersHorizontal className="w-4 h-4" /> Detaylı Filtre
                            </button>
                            <button className="flex-1 lg:flex-none h-10 px-8 inline-flex items-center justify-center bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 whitespace-nowrap">
                                Kataloğu Tara
                            </button>
                        </div>
                    </div>

                    {/* Bottom row: Categories Quick Links (Real DB Data) */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0f172a]/50 flex items-center gap-4 overflow-x-auto custom-scrollbar">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">HIZLI KATEGORİLER:</span>
                        <div className="flex items-center gap-1">
                            {realCategories.map((cat, i) => (
                                <button key={i} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-[#1e293b] hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all whitespace-nowrap">
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section 1: Premium Image Cards (2 Rows, 4 Cols, max 8) */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center">✨</span>
                            Öne Çıkan Katalog Ürünleri
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(() => {
                            const itemsWithImages = items.filter(t => t.product.imageUrl || t.product.images?.length > 0 || t.product.image || t.product.coverImage || t.product.thumbnail || t.localFallbackImage)
                                                         .slice(0, 8); // Strictly 8 items
                            
                            const renderItems = itemsWithImages.length > 0 ? itemsWithImages : items.slice(0, 8);
                            
                            if (renderItems.length === 0) {
                                return <div className="col-span-full py-10 text-slate-500 text-center border border-dashed rounded-2xl dark:border-white/10">Bu havuzda henüz ürün bulunmuyor.</div>;
                            }

                            return renderItems.map((item, idx) => {
                                const imgSafe = item.product.imageUrl || item.product.image || (item.product.images && item.product.images[0]) || item.product.coverImage || item.product.thumbnail || item.localFallbackImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2000&auto=format&fit=crop";
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

                {/* Section 2: Image-less sleek lists (2 Cols, max 8 items) */}
                <div className="pb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center justify-center">📋</span>
                            Endüstriyel Parça İndeksi (Görselsiz)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(() => {
                            const itemsWithoutImages = items.filter(t => !(t.product.imageUrl || t.product.images?.length > 0 || t.product.image || t.product.coverImage || t.product.thumbnail || t.localFallbackImage))
                                                          .slice(0, 8); // Strictly 8 items
                            
                            const renderList = itemsWithoutImages.length > 0 ? itemsWithoutImages : items.slice(0, 8); // Fallback so grid doesn't stay empty
                            
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
