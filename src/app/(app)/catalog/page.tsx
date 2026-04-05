import NetworkRadar from "@/components/network/NetworkRadar";
import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HubCatalogTabs from "@/components/network/HubCatalogTabs";
import CategoryCarousel from "@/components/network/CategoryCarousel";
import {
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Box,
  TrendingUp,
  Activity,
  BarChart2,
  ShieldCheck,
  Briefcase,
  MapPin,
  Grid,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session: any = await getSession();
  const user = session?.user || session;

  if (false) {
    redirect("/login");
  }

  const SHOW_OOS = process.env.CATALOG_SHOW_OUT_OF_STOCK === "true";
  const HIDE_LT_MIN =
    process.env.CATALOG_HIDE_IF_AVAILABLE_LT_MINQTY !== "false";

  const listings = await prismaRaw.networkListing.findMany({
    where: {
      status: "ACTIVE",
      globalProduct: { status: "APPROVED" },
      ...(SHOW_OOS ? {} : { availableQty: { gt: 0 } }),
    },
    include: { globalProduct: true, erpProduct: true },
  });

  const catalogMap = new Map<string, any>();

  for (const listing of listings) {
    if (!listing.globalProduct) continue;
    if (!SHOW_OOS && HIDE_LT_MIN && listing.availableQty < listing.minQty)
      continue;

    const gId = listing.globalProduct.id;
    const p = Number(listing.price);
    const qty = listing.availableQty;

    const ep = listing.erpProduct as any;
    let localImage =
      ep?.imageUrl ||
      ep?.image ||
      (ep?.images && ep.images[0]) ||
      ep?.coverImage ||
      ep?.thumbnail ||
      null;
    const isOwn =
      listing.companyId === user.companyId ||
      listing.tenantId === user.tenantId;

    if (catalogMap.has(gId)) {
      const entry = catalogMap.get(gId)!;
      entry.minPrice = Math.min(entry.minPrice, p);
      entry.maxPrice = Math.max(entry.maxPrice, p);
      entry.sellersCount += 1;
      entry.availableQty += qty;
      if (!entry.localFallbackImage && localImage)
        entry.localFallbackImage = localImage;
      if (isOwn) entry.hasOwnListing = true;
      else entry.hasOtherSellers = true;
    } else {
      catalogMap.set(gId, {
        product: listing.globalProduct,
        minPrice: p,
        maxPrice: p,
        sellersCount: 1,
        availableQty: qty,
        localFallbackImage: localImage,
        hasOwnListing: isOwn,
        hasOtherSellers: !isOwn,
      });
    }
  }

  let items = Array.from(catalogMap.values());

  // Removed mock data hook. Real data mapping handled directly from active query results.

  const realCategories = await prismaRaw.globalCategory.findMany({
    take: 8,
    orderBy: { name: "asc" },
  });

  // Ensure we separate correctly
  const itemsWithImages = items.filter(
    (t) =>
      t.product.imageUrl ||
      t.product.images?.length > 0 ||
      t.product.image ||
      t.product.coverImage ||
      t.product.thumbnail ||
      t.localFallbackImage,
  );
  const monolithItem =
    itemsWithImages.length > 0 ? itemsWithImages[0] : items[0];
  const sixPackItems =
    itemsWithImages.length > 1
      ? itemsWithImages.slice(1, 11)
      : items.slice(1, 11);

  // Everything else to Ledger
  const usedIds = new Set([
    monolithItem?.product.id,
    ...sixPackItems.map((x) => x.product.id),
  ]);
  const ledgerItems = items.filter((t) => !usedIds.has(t.product.id));

  const formatPrice = (p: number) =>
    p.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
  const formatSmallInt = (n: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
  const getImg = (item: any) =>
    item?.product?.imageUrl ||
    item?.product?.image ||
    (item?.product?.images && item?.product?.images[0]) ||
    item?.product?.coverImage ||
    item?.product?.thumbnail ||
    item?.localFallbackImage ||
    null;

  return (
    <div
      className="relative w-full min-h-[100dvh] pb-32 font-sans transition-colors duration-200"
      style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}
    >
      {/* TERMINAL HEADER */}
      <div className="w-full bg-[#030712] border-b border-white/5 h-8 flex items-center shrink-0 overflow-hidden font-mono text-[10px] uppercase tracking-widest text-slate-500 shadow-sm z-50">
        <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap items-center">
          <span className="text-emerald-500 mx-4">■ LIVE NODE CONNECTED</span>
          <span className="opacity-80 mx-4">TGT: +%12 MOM</span>
          <span className="text-blue-500 mx-4">▲ ESCROW LOCK: 50.000 TRY</span>
          <span className="opacity-80 mx-4">
            SUPPLY SHOCK AVERTED IN ISTANBUL
          </span>
          <span className="text-emerald-500 mx-4">■ NETWORK READY</span>
          <span className="opacity-80 mx-4">TGT: +%12 MOM</span>
          <span className="text-blue-500 mx-4">▲ ESCROW LOCK: 50.000 TRY</span>
          <span className="opacity-80 mx-4">
            SUPPLY SHOCK AVERTED IN ISTANBUL
          </span>
        </div>
      </div>

      <div
        className="max-w-[1600px] w-full mx-auto px-6 lg:px-10 py-8 relative animate-in fade-in duration-500"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <HubCatalogTabs />

        {/* NEW ELEGANT MAP HERO & SEARCH */}
        <div className="relative w-full overflow-hidden mb-12 min-h-[550px] flex flex-col items-center justify-between pt-8 pb-4">
          <NetworkRadar />
          <div className="flex-1"></div> {/* Spacer to push search down */}
          {/* Elegant Search Container (Moved to Absolute Bottom of the Hero) */}
          <div className="relative z-40 w-[95%] max-w-[500px] mb-2 animate-in slide-in-from-bottom-5 duration-700 pointer-events-auto">
            <div className="w-full bg-white/95 backdrop-blur-xl rounded-[16px] shadow-[0_20px_50px_-15px_rgba(0,30,80,0.12)] border border-slate-200/70 p-2 h-[3.8rem] flex flex-row items-center ring-4 ring-white/50">
              {/* Keyword */}
              <div className="flex-1 flex items-center h-full px-4">
                <Grid className="w-4 h-4 text-blue-600 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Terminal Araması (Ürün, OEM...)"
                  className="flex-1 h-full w-full bg-transparent border-none p-0 text-[14px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
              </div>

              {/* Search Button */}
              <div className="h-full shrink-0">
                <button className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all text-white font-bold text-[13px] px-8 rounded-[12px] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(59,130,246,0.35)] active:scale-95 duration-200 border border-blue-400/30">
                  <Search className="w-3.5 h-3.5" /> Ağı Tara
                </button>
              </div>
            </div>

            {/* Popular Searches (Pill Tags) */}
            <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-medium text-slate-500 select-none overflow-x-auto pb-2 px-1">
              <span className="font-extrabold text-slate-800 shrink-0 mr-1 flex items-center gap-1 uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                <TrendingUp className="w-3 h-3 text-orange-500" /> Trend
              </span>
              <a
                href="#"
                className="px-2.5 py-0.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
              >
                Fren Balatası
              </a>
              <a
                href="#"
                className="px-2.5 py-0.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
              >
                Motor Yağı
              </a>
              <a
                href="#"
                className="px-2.5 py-0.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
              >
                Dizel Enjektör
              </a>
              <a
                href="#"
                className="px-2.5 py-0.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
              >
                Buji Seti
              </a>
            </div>
          </div>
        </div>

        {/* NEW HOVER-DROPDOWN CATEGORY MENU (Requested by User) */}
        <div className="w-full relative z-30">
          <CategoryCarousel />
        </div>

        {/* THE MATRIX (Compact Bento Grid) */}
        <div className="mb-12 relative z-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" /> B2B Endeksi -
              Yüksek Likidite
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Canlı Teklifler
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4 relative z-0">
            {sixPackItems.slice(0, 10).map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-[1rem] p-4 flex flex-col hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgba(79,70,229,0.05)] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-mono font-bold text-slate-500 border border-slate-200">
                    {item.sellersCount} TEKLİF
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatSmallInt(item.availableQty)} Adet
                  </span>
                </div>

                <div className="w-full h-28 bg-[#f8fafc] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                  {getImg(item) ? (
                    <img
                      src={getImg(item)}
                      alt=""
                      className="w-full h-full object-contain p-2 mix-blend-multiply filter contrast-110 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-200" />
                  )}
                </div>

                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest line-clamp-1 mb-1">
                  {item.product.category || "OEM"}
                </span>
                <h4 className="text-[12px] font-medium text-[#0f172a] leading-tight line-clamp-2 mb-3 flex-1 group-hover:text-indigo-600 transition-colors">
                  {item.product.name}
                </h4>

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="font-mono text-base font-bold text-[#0f172a]">
                    {formatPrice(item.minPrice)}
                    <span className="text-[10px] text-slate-400">₺</span>
                  </div>
                  <Link
                    href={`/catalog/${item.product.id}`}
                    className="w-7 h-7 rounded-md bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}

            {/* EN ÇOK SATANLAR VİTRİNİ (Col span 2) */}
            {sixPackItems.length > 10 && (
              <div className="col-span-2 md:col-span-4 lg:col-span-2 2xl:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-[1rem] p-4 flex flex-col relative overflow-hidden group hover:shadow-[0_10px_30px_rgba(79,70,229,0.2)] transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-blue-400/30 transition-colors duration-700"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="px-2.5 py-1 bg-orange-500/10 rounded-full text-[10px] font-black text-orange-400 border border-orange-500/20 flex items-center gap-1.5 uppercase tracking-widest animate-pulse">
                    <TrendingUp className="w-3 h-3" /> LİDER VİTRİN
                  </span>
                  <span className="text-[9px] text-indigo-300 font-mono opacity-60">
                    ID: {sixPackItems[10]?.product.id.slice(0, 6)}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-1 relative z-10 w-full">
                  <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center p-2 backdrop-blur-md border border-white/5 shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {getImg(sixPackItems[10]) ? (
                      <img
                        src={getImg(sixPackItems[10])}
                        alt=""
                        className="w-full h-full object-contain filter drop-shadow-lg"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white/20" />
                    )}
                  </div>
                  <div className="flex flex-col h-full py-1 flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1 truncate">
                      {sixPackItems[10]?.product.category || "EN ÇOK SATAN"}
                    </span>
                    <h4 className="text-[13px] font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-blue-300 transition-colors">
                      {sixPackItems[10]?.product.name}
                    </h4>
                    <div className="mt-auto flex items-end justify-between w-full gap-2">
                      <div className="font-mono text-[15px] font-black text-emerald-400">
                        {formatPrice(sixPackItems[10]?.minPrice)}₺
                      </div>
                      <Link
                        href={`/catalog/${sixPackItems[10]?.product.id}`}
                        className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-bold shadow-lg transition-colors whitespace-nowrap"
                      >
                        İNCELE
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* THE LEDGER (Ultra Thin Data Rows) */}
        {ledgerItems.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-400" /> Toptan Sipariş
                Defteri
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                      <th className="px-5 py-3 w-10">Varlık</th>
                      <th className="px-5 py-3">Açıklama</th>
                      <th className="px-5 py-3">Kategori</th>
                      <th className="px-5 py-3 text-right">Arz</th>
                      <th className="px-5 py-3 text-right">Taban Fiyat</th>
                      <th className="px-5 py-3 w-20 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-medium text-slate-700">
                    {ledgerItems.map((item: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 last:border-0 hover:bg-[#f8fafc] transition-colors group"
                      >
                        <td className="px-5 py-2.5">
                          <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                            {getImg(item) ? (
                              <img
                                src={getImg(item)}
                                alt=""
                                className="w-full h-full object-cover mix-blend-multiply opacity-70 group-hover:opacity-100 transition-opacity"
                              />
                            ) : (
                              <span className="text-slate-400 block text-[10px]">
                                #
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[#0f172a] font-semibold truncate max-w-[250px]">
                          {item.product.name}
                          <div className="font-mono text-[9px] text-slate-400 font-normal">
                            ID: {item.product.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[11px] text-slate-500">
                          {item.product.category || "Yok"}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                            {formatSmallInt(item.availableQty)}
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-[#0f172a]">
                          {formatPrice(item.minPrice)}
                          <span className="text-[10px] text-slate-400 font-sans ml-0.5">
                            ₺
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <Link
                            href={`/catalog/${item.product.id}`}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors inline-block"
                          >
                            İncele
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
                @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
                .animate-\\[marquee_25s_linear_infinite\\] { animation: marquee 25s linear infinite; }
            `,
        }}
      ></style>
    </div>
  );
}
