import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";
import { Search, SlidersHorizontal, Globe, Flame, TrendingUp, Activity, BarChart2, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: { q?: string } }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const SHOW_OOS = process.env.CATALOG_SHOW_OUT_OF_STOCK === "true";
    const HIDE_LT_MIN = process.env.CATALOG_HIDE_IF_AVAILABLE_LT_MINQTY !== "false";

    const listings = await prismaRaw.networkListing.findMany({
        where: {
            status: "ACTIVE",
            globalProduct: { status: "APPROVED" },
            ...(SHOW_OOS ? {} : { availableQty: { gt: 0 } })
        },
        include: { globalProduct: true, erpProduct: true },
    });

    const catalogMap = new Map<string, any>();

    for (const listing of listings) {
        if (!listing.globalProduct) continue;
        if (!SHOW_OOS && HIDE_LT_MIN && listing.availableQty < listing.minQty) continue;

        const gId = listing.globalProduct.id;
        const p = Number(listing.price);
        const qty = listing.availableQty;
        
        const ep = listing.erpProduct as any;
        let localImage = ep?.imageUrl || ep?.image || (ep?.images && ep.images[0]) || ep?.coverImage || ep?.thumbnail || null;
        const isOwn = listing.companyId === user.companyId || listing.tenantId === user.tenantId;

        if (catalogMap.has(gId)) {
            const entry = catalogMap.get(gId)!;
            entry.minPrice = Math.min(entry.minPrice, p);
            entry.maxPrice = Math.max(entry.maxPrice, p);
            entry.sellersCount += 1;
            entry.availableQty += qty;
            if (!entry.localFallbackImage && localImage) entry.localFallbackImage = localImage;
            if (isOwn) entry.hasOwnListing = true;
            else entry.hasOtherSellers = true;
        } else {
            catalogMap.set(gId, {
                product: listing.globalProduct, minPrice: p, maxPrice: p,
                sellersCount: 1, availableQty: qty, localFallbackImage: localImage,
                hasOwnListing: isOwn, hasOtherSellers: !isOwn
            });
        }
    }

    const items = Array.from(catalogMap.values());
    const realCategories = await prismaRaw.globalCategory.findMany({ take: 8, orderBy: { name: 'asc' } });

    // Split items for layout
    const itemsWithImages = items.filter(t => t.product.imageUrl || t.product.images?.length > 0 || t.product.image || t.product.coverImage || t.product.thumbnail || t.localFallbackImage);
    const monolithItem = itemsWithImages.length > 0 ? itemsWithImages[0] : items[0];
    const sixPackItems = itemsWithImages.length > 1 ? itemsWithImages.slice(1, 7) : items.slice(1, 7);
    const ledgerItems = items.filter(t => !itemsWithImages.slice(0, 7).includes(t)).slice(0, 8);

    const formatPrice = (p: number) => p.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const getImg = (item: any) => item?.product?.imageUrl || item?.product?.image || (item?.product?.images && item?.product?.images[0]) || item?.product?.coverImage || item?.product?.thumbnail || item?.localFallbackImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2000&auto=format&fit=crop";

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0b1120] min-h-screen flex flex-col w-full font-sans transition-colors duration-500">
            {/* TOP TICKER - LIVE TRADE RADAR */}
            <div className="w-full bg-slate-900 dark:bg-[#020617] text-white border-b border-white/10 overflow-hidden shrink-0 flex items-center h-8">
                <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap items-center text-[10px] font-bold tracking-widest uppercase">
                    <span className="text-emerald-400 mx-4">• CANLI AĞ:</span>
                    <span className="opacity-70 mx-4">İstanbul bölgesinde Motor Yağı talebi %40 arttı</span>
                    <span className="text-blue-400 mx-4">• ANLIK İŞLEM:</span>
                    <span className="opacity-70 mx-4">A*** A.Ş. 500 Koli Filtre Siparişi Geçti (Escrow Kilitlendi)</span>
                    <span className="text-amber-400 mx-4">• KÜRESEL SİNYAL:</span>
                    <span className="opacity-70 mx-4">Zircir fiyatlarında 30 günlük düşüş trendi tespit edildi</span>
                    <span className="text-emerald-400 mx-4">• CANLI AĞ:</span>
                    <span className="opacity-70 mx-4">İzmir'de Balata kategorisi 2.2K aramaya ulaştı</span>
                </div>
            </div>

            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700 flex-1">
                <HubCatalogTabs />
                
                {/* ADVANCED SEARCH HUB */}
                <div className="w-full bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none mb-10 overflow-hidden mt-6 transition-all">
                    <div className="flex flex-col lg:flex-row p-3 gap-3 items-center">
                        <div className="relative flex-1 min-w-0 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl flex items-center px-4 h-14 border border-transparent focus-within:border-indigo-500/50 transition-all">
                            <Search className="h-5 w-5 text-slate-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Gelişmiş Terminal Araması (Stok Kodu, Marka veya Kategori)..."
                                className="w-full h-full bg-transparent border-none text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0 ml-3"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto">
                            <button className="flex-1 lg:flex-none h-14 px-6 inline-flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm font-bold rounded-2xl transition-all whitespace-nowrap gap-2 shadow-sm">
                                <SlidersHorizontal className="w-4 h-4" /> Filtreler
                            </button>
                            <button className="flex-1 lg:flex-none h-14 px-10 inline-flex items-center justify-center bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap tracking-wide">
                                Otonom Tarama
                            </button>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-4 overflow-x-auto custom-scrollbar">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">HIZLI RADAR:</span>
                        <div className="flex items-center gap-2">
                            {realCategories.map((cat, i) => (
                                <button key={i} className="px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 hover:shadow-sm border border-slate-200/50 dark:border-white/5 transition-all whitespace-nowrap cursor-pointer">
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* THE MONOLITH (Dev Vitrin) */}
                {monolithItem && (
                    <div className="w-full rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 shadow-sm mb-10 overflow-hidden flex flex-col lg:flex-row group hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-500 relative">
                        {/* Parallax Image Side */}
                        <div className="w-full lg:w-1/2 aspect-video lg:aspect-auto bg-slate-100/50 dark:bg-slate-950/50 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white dark:to-slate-900 z-10 hidden lg:block"></div>
                            <div className="absolute top-4 left-4 z-20 flex gap-2">
                                <span className="bg-rose-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-lg shadow-rose-500/20 shadow-sm border border-rose-400/50">
                                    <Flame className="w-3 h-3 animate-pulse" /> TRENDING ALARM
                                </span>
                            </div>
                            <img src={getImg(monolithItem)} alt="Monolith" className="w-[80%] h-[80%] object-contain group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out z-0 filter drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal" />
                        </div>
                        
                        {/* Content Side */}
                        <div className="w-full lg:w-1/2 p-8 lg:p-14 flex flex-col justify-center relative z-20">
                            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3">{monolithItem.product.category || "PREMIUM KATEGORİ"}</span>
                            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                                {monolithItem.product.name}
                            </h2>
                            
                            <div className="flex items-end gap-3 mb-8">
                                <span className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatPrice(monolithItem.minPrice)}<span className="text-2xl text-slate-400 tracking-normal ml-1">₺</span></span>
                                <span className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">/Birim (KDV Hariç)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 backdrop-blur border-b-[3px]">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ağ İçi Onaylı Stok</div>
                                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">{monolithItem.availableQty} <CheckCircle2 className="w-4 h-4"/></div>
                                </div>
                                <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 backdrop-blur border-b-[3px]">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Piyasa Rekabeti</div>
                                    <div className="text-xl font-black text-blue-600 dark:text-blue-400">{monolithItem.sellersCount} Satıcı</div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {!(monolithItem.hasOwnListing && !monolithItem.hasOtherSellers) && (
                                    <button className="flex-1 h-14 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                        Tek Tıkla Sepete At
                                    </button>
                                )}
                                <Link href={`/catalog/${monolithItem.product.id}`} className="h-14 px-8 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                    {monolithItem.hasOwnListing && !monolithItem.hasOtherSellers ? "Senin İlanın" : "Analiz Et"}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* THE SIX-PACK MATRIX (6'lı Zırhlı Vitrin) */}
                <div className="mb-12">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <Activity className="text-indigo-500" /> Piyasa Hareketliliği Yüksekler
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sixPackItems.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border border-slate-200 dark:border-white/10 shadow-sm">
                                        {item.sellersCount} SATICI
                                    </span>
                                </div>
                                
                                <div className="w-full h-48 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20 border border-transparent transition-colors">
                                    <img src={getImg(item)} alt="" className="w-[70%] h-[70%] object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal filter drop-shadow-md" />
                                </div>
                                
                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">{item.product.category || "Kategori"}</span>
                                <h4 className="text-[14px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-4 flex-1">
                                    {item.product.name}
                                </h4>
                                
                                <div className="flex items-end justify-between mt-auto">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En İyi Fiyat</div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">{formatPrice(item.minPrice)}<span className="text-sm text-slate-400 ml-0.5">₺</span></div>
                                    </div>
                                    <Link href={`/catalog/${item.product.id}`} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-white flex items-center justify-center transition-colors border-2 border-transparent hover:border-indigo-400 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* THE LEDGER (Liste Vitrin) */}
                {ledgerItems.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <BarChart2 className="text-indigo-500"/> B2B Hızlı Alım Listesi
                        </h3>
                        
                        <div className="bg-white/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm backdrop-blur-xl">
                            {ledgerItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors gap-4 group">
                                    <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-white/5">
                                            <span className="opacity-50">📂</span>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{item.product.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.product.category || 'GENEL'}</span>
                                                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">ID:{item.product.id.slice(0,6)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 pl-2 sm:border-l border-slate-100 dark:border-white/5">
                                        <div className="text-right">
                                            <div className="text-[15px] font-black text-slate-900 dark:text-white">{formatPrice(item.minPrice)}<span className="text-xs text-slate-400">₺</span></div>
                                            <div className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> {item.availableQty} STOK</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!(item.hasOwnListing && !item.hasOtherSellers) && (
                                                <button className="h-10 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-colors">
                                                    Al
                                                </button>
                                            )}
                                            <Link href={`/catalog/${item.product.id}`} className="h-10 px-4 flex items-center justify-center border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                İncele
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* INJECT MARQUEE CSS JUST FOR RADAR */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
                .animate-\\[marquee_20s_linear_infinite\\] { animation: marquee 20s linear infinite; }
            `}}></style>
        </div>
    );
}
