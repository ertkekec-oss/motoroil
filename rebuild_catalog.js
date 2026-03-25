const fs = require('fs');
const file = 'src/app/(app)/catalog/page.tsx';

let content = `import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";
import { Search, SlidersHorizontal, Image as ImageIcon, Box, TrendingUp, Activity, BarChart2, ShieldCheck, ChevronRight } from "lucide-react";

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

    let items = Array.from(catalogMap.values());

    // DEMO DATA (If empty or too few)
    if (items.length < 15) {
        const mockData = [
            {
                product: { id: 'm1', name: 'Castrol EDGE 5W-30 Tam Sentetik Motor Yağı (208 Litre Varil)', category: 'Motor Yağları', imageUrl: 'https://images.unsplash.com/photo-1635293414920-53e7f9f31ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 42500, maxPrice: 45000, sellersCount: 8, availableQty: 125, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm2', name: 'VARTA Promotive EFB Ağır Vasıta Aküsü 190Ah', category: 'Aküler', imageUrl: 'https://images.unsplash.com/photo-1620050854497-2fedd6a8f654?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 8500, maxPrice: 9200, sellersCount: 4, availableQty: 840, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm3', name: 'SKF Endüstriyel Rulman Aksesuar Kiti (100 Kutu, Toptan)', category: 'Kayış & Rulman', imageUrl: 'https://images.unsplash.com/photo-1590518465064-071a93e36eab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 1250, maxPrice: 1400, sellersCount: 12, availableQty: 3200, hasOwnListing: true, hasOtherSellers: true
            },
            {
                product: { id: 'm4', name: 'Brembo Xtra Performans Çelik Karbon Fren Diski', category: 'Fren Sistemi', imageUrl: 'https://images.unsplash.com/photo-1588636254707-16447cde6c57?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 3400, maxPrice: 3800, sellersCount: 6, availableQty: 540, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm5', name: 'Michelin Pilot Sport 4S 245/40R19 (Yaz Lastiği Palet - 100 Adet)', category: 'Lastikler', imageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 650000, maxPrice: 680000, sellersCount: 3, availableQty: 15, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm6', name: 'Delphi Dizel Common Rail Enjektör Seti', category: 'Yakıt Sistemi', imageUrl: 'https://images.unsplash.com/photo-1533423719223-2cb97914e6fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 12500, maxPrice: 13000, sellersCount: 5, availableQty: 120, hasOwnListing: true, hasOtherSellers: true
            },
            {
                product: { id: 'm7', name: "Würth DPF Partikül Filtre Temizleyici (24\\'lü Koli)", category: 'Kimyasallar', imageUrl: 'https://images.unsplash.com/photo-1604514813560-1e4f57261a29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 4200, maxPrice: 4450, sellersCount: 15, availableQty: 850, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm8', name: 'NGK Lazer İridyum Buji Seti (Performans)', category: 'Ateşleme Sistemi', imageUrl: 'https://images.unsplash.com/photo-1549419163-95295c5db9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
                minPrice: 1800, maxPrice: 2000, sellersCount: 9, availableQty: 1100, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm9', name: 'MANN-FILTER Gelişmiş Yağ Filtresi (Toptan Sipariş Pakedi)', category: 'Filtreler', imageUrl: null },
                minPrice: 345, maxPrice: 400, sellersCount: 22, availableQty: 50000, hasOwnListing: true, hasOtherSellers: true
            },
            {
                product: { id: 'm10', name: 'Valeo Silecek Süpürge Braket Takımı', category: 'Dış Aksam', imageUrl: null },
                minPrice: 280, maxPrice: 310, sellersCount: 18, availableQty: 12500, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm11', name: 'Otomotiv Sanayi Tip Halojen Farlar (OEM Standart)', category: 'Aydınlatma', imageUrl: null },
                minPrice: 950, maxPrice: 1100, sellersCount: 4, availableQty: 800, hasOwnListing: false, hasOtherSellers: true
            },
            {
                product: { id: 'm12', name: 'Akü Şasi Bağlantı Kabloları (Ağır Hizmet)', category: 'Elektrik', imageUrl: null },
                minPrice: 120, maxPrice: 150, sellersCount: 7, availableQty: 4200, hasOwnListing: false, hasOtherSellers: true
            }
        ];
        items = [...items, ...mockData];
    }
    
    const realCategories = await prismaRaw.globalCategory.findMany({ take: 8, orderBy: { name: 'asc' } });

    // Ensure we separate correctly
    const itemsWithImages = items.filter(t => t.product.imageUrl || t.product.images?.length > 0 || t.product.image || t.product.coverImage || t.product.thumbnail || t.localFallbackImage);
    const monolithItem = itemsWithImages.length > 0 ? itemsWithImages[0] : items[0];
    const sixPackItems = itemsWithImages.length > 1 ? itemsWithImages.slice(1, 11) : items.slice(1, 11);
    
    // Everything else to Ledger
    const usedIds = new Set([monolithItem?.product.id, ...sixPackItems.map(x => x.product.id)]);
    const ledgerItems = items.filter(t => !usedIds.has(t.product.id));

    const formatPrice = (p: number) => p.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const formatSmallInt = (n: number) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(n);
    const getImg = (item: any) => item?.product?.imageUrl || item?.product?.image || (item?.product?.images && item?.product?.images[0]) || item?.product?.coverImage || item?.product?.thumbnail || item?.localFallbackImage || null;

    return (
        <div className="bg-slate-50 dark:bg-[#030712] min-h-screen flex flex-col w-full font-sans transition-colors duration-200">
            {/* TERMINAL HEADER */}
            <div className="w-full bg-[#030712] border-b border-white/5 h-8 flex items-center shrink-0 overflow-hidden font-mono text-[10px] uppercase tracking-widest text-slate-500 shadow-sm z-50">
                <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap items-center">
                    <span className="text-emerald-500 mx-4">■ LIVE NODE CONNECTED</span>
                    <span className="opacity-80 mx-4">TGT: +%12 MOM</span>
                    <span className="text-blue-500 mx-4">▲ ESCROW LOCK: 50.000 TRY</span>
                    <span className="opacity-80 mx-4">SUPPLY SHOCK AVERTED IN ISTANBUL</span>
                    <span className="text-emerald-500 mx-4">■ NETWORK READY</span>
                    <span className="opacity-80 mx-4">TGT: +%12 MOM</span>
                    <span className="text-blue-500 mx-4">▲ ESCROW LOCK: 50.000 TRY</span>
                    <span className="opacity-80 mx-4">SUPPLY SHOCK AVERTED IN ISTANBUL</span>
                </div>
            </div>

            <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-10 py-8 flex-1 animate-in fade-in duration-500">
                <HubCatalogTabs />
                
                {/* ADVANCED SEARCH CONSOLE */}
                <div className="w-full bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-white/5 rounded-2xl mb-8 flex items-center p-2 shadow-sm transition-all focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 mt-4">
                    <Search className="h-4 w-4 text-slate-400 ml-3 shrink-0" />
                    <input
                        type="text"
                        placeholder="Terminal araması (SKU, OEM, Marka)..."
                        className="flex-1 bg-transparent border-none text-[13px] font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 focus:outline-none focus:ring-0 ml-3 h-10"
                    />
                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-3"></div>
                    <button className="h-9 px-4 inline-flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg transition-colors gap-2">
                        <SlidersHorizontal className="w-3 h-3" /> Filters
                    </button>
                </div>

                {/* THE HIGHLIGHT (Refined Monolith) */}
                {monolithItem && (
                    <div className="w-full bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row mb-10 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-white/10 group min-h-[300px]">
                        {/* Compact Spotlight Image */}
                        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-[#030712]/50 relative flex items-center justify-center p-8 group-hover:bg-slate-100 dark:group-hover:bg-[#050b16] transition-colors border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span> Market Hot
                            </div>
                            {getImg(monolithItem) ? (
                                <img src={getImg(monolithItem)} alt={monolithItem.product.name} className="w-full object-contain mix-blend-multiply dark:mix-blend-lighten max-h-[300px] filter contrast-125" onError={(e:any) => e.target.style.display='none'} />
                            ) : (
                                <div className="w-32 h-32 flex items-center justify-center text-slate-200 dark:text-white/5">
                                    <Box className="w-16 h-16" />
                                </div>
                            )}
                        </div>
                        
                        {/* Compact Spotlight Identity */}
                        <div className="w-full md:w-7/12 p-8 lg:p-12 pl-8 lg:pl-16 flex flex-col justify-center">
                            <div className="flex flex-col mb-6">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Activity className="w-3 h-3" /> {monolithItem.product.category || "GLOBAL TIER"}
                                </span>
                                <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {monolithItem.product.name}
                                </h2>
                                <span className="font-mono text-xs text-slate-400 mt-2">SKU: {monolithItem.product.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter">
                                    {formatPrice(monolithItem.minPrice)}<span className="text-xl text-slate-500">₺</span>
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-2">/ Birim</span>
                            </div>

                            <div className="flex items-center gap-6 border-t border-slate-100 dark:border-white/5 pt-6 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Network Supply</span>
                                    <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        {formatSmallInt(monolithItem.availableQty)} <ShieldCheck className="w-4 h-4"/>
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sellers</span>
                                    <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {monolithItem.sellersCount}
                                    </span>
                                </div>
                                <div className="ml-auto">
                                    <Link href={\`/catalog/\${monolithItem.product.id}\`} className="h-10 px-6 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all gap-2 group">
                                        Terminal <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* THE MATRIX (Compact Bento Grid) */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" /> B2B Index - High Liquidity
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Live Quotes</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
                        {sixPackItems.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-white/5 rounded-[1rem] p-4 flex flex-col hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgba(79,70,229,0.05)] transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                                        {item.sellersCount} OFFERS
                                    </span>
                                    <span className="text-[10px] text-slate-400">{formatSmallInt(item.availableQty)} qty</span>
                                </div>
                                
                                <div className="w-full h-28 bg-slate-50 dark:bg-[#030712] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                                    {getImg(item) ? (
                                        <img src={getImg(item)} alt="" className="w-full h-full object-contain p-2 mix-blend-multiply dark:mix-blend-lighten filter contrast-110 group-hover:scale-105 transition-transform duration-500" onError={(e:any) => e.target.style.display='none'} />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-slate-200 dark:text-white/5" />
                                    )}
                                </div>
                                
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest line-clamp-1 mb-1">{item.product.category || "OEM"}</span>
                                <h4 className="text-[12px] font-medium text-slate-900 dark:text-zinc-200 leading-tight line-clamp-2 mb-3 flex-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {item.product.name}
                                </h4>
                                
                                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
                                        {formatPrice(item.minPrice)}<span className="text-[10px] text-slate-400">₺</span>
                                    </div>
                                    <Link href={\`/catalog/\${item.product.id}\`} className="w-7 h-7 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-zinc-400 flex items-center justify-center transition-colors">
                                        <ChevronRight className="w-3 h-3"/>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* THE LEDGER (Ultra Thin Data Rows) */}
                {ledgerItems.length > 0 && (
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-slate-400"/> Order Book (Toptan Sipariş Defteri)
                            </h3>
                        </div>
                        
                        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-[#030712] border-b border-slate-200 dark:border-white/5 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                            <th className="px-5 py-3 w-10">Asset</th>
                                            <th className="px-5 py-3">Description</th>
                                            <th className="px-5 py-3">Category</th>
                                            <th className="px-5 py-3 text-right">Supply</th>
                                            <th className="px-5 py-3 text-right">Floor Price</th>
                                            <th className="px-5 py-3 w-20 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[13px] font-medium text-slate-700 dark:text-zinc-300">
                                        {ledgerItems.map((item: any, idx: number) => (
                                            <tr key={idx} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-5 py-2.5">
                                                    <div className="w-7 h-7 bg-slate-100 dark:bg-white/5 rounded flex items-center justify-center overflow-hidden">
                                                        {getImg(item) ? (
                                                            <img src={getImg(item)} alt="" className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-lighten opacity-70 group-hover:opacity-100 transition-opacity" onError={(e:any) => e.target.style.display='none'} />
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-600 block text-[10px]">#</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2.5 text-slate-900 dark:text-zinc-100 font-semibold truncate max-w-[250px]">
                                                    {item.product.name}
                                                    <div className="font-mono text-[9px] text-slate-400 font-normal">ID: {item.product.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="px-5 py-2.5 text-[11px] text-slate-500">{item.product.category || 'N/A'}</td>
                                                <td className="px-5 py-2.5 text-right">
                                                    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                                                        {formatSmallInt(item.availableQty)}
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    </span>
                                                </td>
                                                <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatPrice(item.minPrice)}<span className="text-[10px] text-slate-400 font-sans ml-0.5">₺</span>
                                                </td>
                                                <td className="px-5 py-2.5 text-center">
                                                    <Link href={\`/catalog/\${item.product.id}\`} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors inline-block">
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{__html: \`
                @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
                .animate-\\\\[marquee_25s_linear_infinite\\\\] { animation: marquee 25s linear infinite; }
            \`}}></style>
        </div>
    );
}
`;

fs.writeFileSync(file, content);
console.log('Rebuilt catalog');
