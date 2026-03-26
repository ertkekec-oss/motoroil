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

  // DEMO DATA (If empty or too few)
  if (items.length < 15) {
    const mockData = [
      {
        product: {
          id: "m1",
          name: "Castrol EDGE 5W-30 Tam Sentetik Motor Yağı (208 Litre Varil)",
          category: "Motor Yağları",
          imageUrl:
            "https://images.unsplash.com/photo-1635293414920-53e7f9f31ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 42500,
        maxPrice: 45000,
        sellersCount: 8,
        availableQty: 125,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m2",
          name: "VARTA Promotive EFB Ağır Vasıta Aküsü 190Ah",
          category: "Aküler",
          imageUrl:
            "https://images.unsplash.com/photo-1620050854497-2fedd6a8f654?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 8500,
        maxPrice: 9200,
        sellersCount: 4,
        availableQty: 840,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m3",
          name: "SKF Endüstriyel Rulman Aksesuar Kiti (100 Kutu, Toptan)",
          category: "Kayış & Rulman",
          imageUrl:
            "https://images.unsplash.com/photo-1590518465064-071a93e36eab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 1250,
        maxPrice: 1400,
        sellersCount: 12,
        availableQty: 3200,
        hasOwnListing: true,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m4",
          name: "Brembo Xtra Performans Çelik Karbon Fren Diski",
          category: "Fren Sistemi",
          imageUrl:
            "https://images.unsplash.com/photo-1588636254707-16447cde6c57?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 3400,
        maxPrice: 3800,
        sellersCount: 6,
        availableQty: 540,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m5",
          name: "Michelin Pilot Sport 4S 245/40R19 (Yaz Lastiği Palet - 100 Adet)",
          category: "Lastikler",
          imageUrl:
            "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 650000,
        maxPrice: 680000,
        sellersCount: 3,
        availableQty: 15,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m6",
          name: "Delphi Dizel Common Rail Enjektör Seti",
          category: "Yakıt Sistemi",
          imageUrl:
            "https://images.unsplash.com/photo-1533423719223-2cb97914e6fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 12500,
        maxPrice: 13000,
        sellersCount: 5,
        availableQty: 120,
        hasOwnListing: true,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m7",
          name: "Würth DPF Partikül Filtre Temizleyici (24\'lü Koli)",
          category: "Kimyasallar",
          imageUrl:
            "https://images.unsplash.com/photo-1604514813560-1e4f57261a29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 4200,
        maxPrice: 4450,
        sellersCount: 15,
        availableQty: 850,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m8",
          name: "NGK Lazer İridyum Buji Seti (Performans)",
          category: "Ateşleme Sistemi",
          imageUrl:
            "https://images.unsplash.com/photo-1549419163-95295c5db9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        minPrice: 1800,
        maxPrice: 2000,
        sellersCount: 9,
        availableQty: 1100,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m9",
          name: "MANN-FILTER Gelişmiş Yağ Filtresi (Toptan Sipariş Pakedi)",
          category: "Filtreler",
          imageUrl: null,
        },
        minPrice: 345,
        maxPrice: 400,
        sellersCount: 22,
        availableQty: 50000,
        hasOwnListing: true,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m10",
          name: "Valeo Silecek Süpürge Braket Takımı",
          category: "Dış Aksam",
          imageUrl: null,
        },
        minPrice: 280,
        maxPrice: 310,
        sellersCount: 18,
        availableQty: 12500,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m11",
          name: "Otomotiv Sanayi Tip Halojen Farlar (OEM Standart)",
          category: "Aydınlatma",
          imageUrl: null,
        },
        minPrice: 950,
        maxPrice: 1100,
        sellersCount: 4,
        availableQty: 800,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
      {
        product: {
          id: "m12",
          name: "Akü Şasi Bağlantı Kabloları (Ağır Hizmet)",
          category: "Elektrik",
          imageUrl: null,
        },
        minPrice: 120,
        maxPrice: 150,
        sellersCount: 7,
        availableQty: 4200,
        hasOwnListing: false,
        hasOtherSellers: true,
      },
    ];
    items = [...items, ...mockData];
  }

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
          {/* Turkey Map SVG Background */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply bg-center bg-no-repeat bg-contain"
            style={{
              backgroundImage:
                "url('https://upload.wikimedia.org/wikipedia/commons/b/bc/BlankMap-Turkey.svg')",
              backgroundPosition: "center",
              backgroundSize: "90% auto",
            }}
          ></div>
          {/* Central "P" Node (Periodya Octopus Center) */}
          <div className="absolute top-1/2 left-[52%] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center group/center">
            {/* Outer pulsating rings */}
            <div className="absolute w-[300px] h-[300px] bg-blue-500/5 rounded-full animate-ping duration-1000"></div>
            <div className="absolute w-[150px] h-[150px] bg-blue-500/10 rounded-full animate-pulse"></div>

            {/* The Core P */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.6)] border-4 border-white/20 z-10 hover:scale-110 transition-transform cursor-pointer">
              <span className="text-white text-4xl font-black italic drop-shadow-md">
                P
              </span>

              {/* Core Status Label */}
              <div className="absolute -top-8 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg opacity-0 group-hover/center:opacity-100 group-hover/center:-translate-y-1 transition-all pointer-events-none">
                HUB MERKEZİ AKTİF
              </div>
            </div>
          </div>
          {/* Logistics Network Lines (Ahtapot Kolları) */}
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-40">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
              </linearGradient>
              <style>
                {`
                  @keyframes mydash {
                    to { stroke-dashoffset: -12; }
                  }
                  .animate-lines {
                    animation: mydash 1.5s linear infinite;
                  }
                `}
              </style>
            </defs>
            {[
              { x: "25%", y: "28%" }, // Istanbul
              { x: "12%", y: "45%" }, // Izmir
              { x: "38%", y: "38%" }, // Ankara
              { x: "28%", y: "65%" }, // Antalya
              { x: "65%", y: "68%" }, // Adana
              { x: "82%", y: "55%" }, // Diyarbakir
              { x: "78%", y: "25%" }, // Trabzon
              { x: "90%", y: "35%" }, // Erzurum
              { x: "55%", y: "20%" }, // Samsun
            ].map((p, i) => (
              <g key={i}>
                <line
                  x1="52%"
                  y1="50%"
                  x2={p.x}
                  y2={p.y}
                  stroke="url(#lineGrad)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className="animate-lines"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="#3b82f6"
                  className="animate-pulse"
                />
              </g>
            ))}
          </svg>
          {/* Glowing Signals on Map (Sprinkled Demands across Turkey) */}
          <div className="absolute w-full h-full inset-0 mx-auto pointer-events-none z-10">
            {[
              // Istanbul
              {
                top: "28%",
                left: "25%",
                color: "bg-blue-500",
                shadow: "shadow-[0_0_15px_rgba(59,130,246,0.8)]",
                delay: "0s",
                count: "128k Talep",
              },
              // Izmir
              {
                top: "45%",
                left: "12%",
                color: "bg-indigo-500",
                shadow: "shadow-[0_0_15px_rgba(99,102,241,0.8)]",
                delay: "1s",
                count: "45k Talep",
              },
              // Ankara
              {
                top: "38%",
                left: "38%",
                color: "bg-blue-400",
                shadow: "shadow-[0_0_15px_rgba(96,165,250,0.8)]",
                delay: "2s",
                count: "310k İşlem",
              },
              // Antalya
              {
                top: "65%",
                left: "28%",
                color: "bg-teal-500",
                shadow: "shadow-[0_0_15px_rgba(20,184,166,0.8)]",
                delay: "0.5s",
                count: "12k Talep",
              },
              // Adana
              {
                top: "68%",
                left: "65%",
                color: "bg-slate-400",
                shadow: "shadow-[0_0_15px_rgba(148,163,184,0.8)]",
                delay: "1.5s",
                count: "8.1k Teklif",
              },
              // Diyarbakir
              {
                top: "55%",
                left: "82%",
                color: "bg-indigo-400",
                shadow: "shadow-[0_0_10px_rgba(129,140,248,0.8)]",
                delay: "0.2s",
                count: "8k Talep",
              },
              // Trabzon
              {
                top: "25%",
                left: "78%",
                color: "bg-blue-500",
                shadow: "shadow-[0_0_15px_rgba(59,130,246,0.8)]",
                delay: "2.5s",
                count: "3.5k Talep",
              },
              // Erzurum
              {
                top: "35%",
                left: "90%",
                color: "bg-slate-400",
                shadow: "shadow-[0_0_15px_rgba(148,163,184,0.8)]",
                delay: "1.1s",
                count: "1.2k İşlem",
              },
              // Samsun
              {
                top: "20%",
                left: "55%",
                color: "bg-indigo-400",
                shadow: "shadow-[0_0_15px_rgba(129,140,248,0.8)]",
                delay: "0.8s",
                count: "6.4k Talep",
              },
            ].map((pos, idx) => (
              <div
                key={idx}
                className="absolute flex items-center group pointer-events-auto mix-blend-multiply"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Yanıp Sönen Nokta */}
                <div
                  className="w-10 h-10 rounded-full bg-blue-100/30 flex items-center justify-center animate-pulse relative z-10 border border-white/40 backdrop-blur-[1px] group-hover:scale-125 transition-transform"
                  style={{ animationDelay: pos.delay, animationDuration: "2s" }}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${pos.color} ${pos.shadow}`}
                  ></div>
                </div>

                {/* Talep Sayısı Etiketi (Şık HUD Badge) */}
                <div className="absolute left-[80%] whitespace-nowrap ml-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-[0_4px_15px_rgba(0,0,0,0.08)] flex items-center z-20 group-hover:scale-110 transition-all cursor-pointer">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 animate-pulse ${pos.color}`}
                  ></div>
                  <span className="text-[10px] font-black font-mono tracking-wide text-slate-800">
                    {pos.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1"></div> {/* Spacer to push search down */}
          {/* Elegant Search Container (Moved to Absolute Bottom of the Hero) */}
          <div className="relative z-30 w-[95%] max-w-[650px] mb-2 animate-in slide-in-from-bottom-5 duration-700 pointer-events-auto">
            <div className="w-full bg-white/95 backdrop-blur-xl rounded-[16px] shadow-[0_20px_50px_-15px_rgba(0,30,80,0.12)] border border-slate-200/70 p-2.5 h-[4.5rem] flex flex-row items-center ring-4 ring-white/50">
              {/* Keyword */}
              <div className="flex-1 flex items-center h-full px-5">
                <Grid className="w-5 h-5 text-blue-600 mr-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Terminal Araması (Marka, Ürün Kodu, OEM)"
                  className="flex-1 h-full w-full bg-transparent border-none p-0 text-[15px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
              </div>

              {/* Search Button */}
              <div className="h-full shrink-0">
                <button className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all text-white font-bold text-[14px] px-10 rounded-[10px] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(59,130,246,0.35)] active:scale-95 duration-200 border border-blue-400/30">
                  <Search className="w-4 h-4" /> Ağı Tara
                </button>
              </div>
            </div>

            {/* Popular Searches (Pill Tags) */}
            <div className="flex items-center justify-center gap-2.5 mt-5 text-[11px] font-medium text-slate-500 select-none overflow-x-auto pb-2 px-1">
              <span className="font-extrabold text-slate-800 shrink-0 mr-1 flex items-center gap-1.5 uppercase tracking-wider text-[10px] bg-white/50 px-2 py-1 rounded-full border border-slate-200">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" /> Trendler
              </span>
              <a
                href="#"
                className="px-3 py-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
              >
                Fren Balatası
              </a>
              <a
                href="#"
                className="px-3 py-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
              >
                Motor Yağı
              </a>
              <a
                href="#"
                className="px-3 py-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
              >
                Dizel Enjektör
              </a>
              <a
                href="#"
                className="px-3 py-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all shrink-0 font-bold"
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
              <TrendingUp className="w-4 h-4 text-slate-400" /> B2B Index - High
              Liquidity
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Live Quotes
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4 relative z-0">
            {sixPackItems.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-white  border border-slate-200  rounded-[1rem] p-4 flex flex-col hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgba(79,70,229,0.05)] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 bg-slate-100  rounded text-[9px] font-mono font-bold text-slate-500  border border-slate-200 ">
                    {item.sellersCount} OFFERS
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatSmallInt(item.availableQty)} qty
                  </span>
                </div>

                <div className="w-full h-28 bg-[#f8fafc] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                  {getImg(item) ? (
                    <img
                      src={getImg(item)}
                      alt=""
                      className="w-full h-full object-contain p-2 mix-blend-multiply  filter contrast-110 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-200 " />
                  )}
                </div>

                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest line-clamp-1 mb-1">
                  {item.product.category || "OEM"}
                </span>
                <h4 className="text-[12px] font-medium text-[#0f172a]  leading-tight line-clamp-2 mb-3 flex-1 group-hover:text-indigo-600 :text-indigo-400 transition-colors">
                  {item.product.name}
                </h4>

                <div className="mt-auto pt-3 border-t border-slate-100  flex items-center justify-between">
                  <div className="font-mono text-base font-bold text-[#0f172a] ">
                    {formatPrice(item.minPrice)}
                    <span className="text-[10px] text-slate-400">₺</span>
                  </div>
                  <Link
                    href={`/catalog/${item.product.id}`}
                    className="w-7 h-7 rounded-md bg-slate-100  hover:bg-indigo-600 hover:text-white text-slate-600  flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
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
              <h3 className="text-sm font-bold text-[#0f172a]  uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-400" /> Order Book
                (Toptan Sipariş Defteri)
              </h3>
            </div>

            <div className="bg-white  border border-slate-200  rounded-2xl overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#f8fafc]  border-b border-slate-200  text-[10px] uppercase tracking-widest font-bold text-slate-500">
                      <th className="px-5 py-3 w-10">Asset</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3 text-right">Supply</th>
                      <th className="px-5 py-3 text-right">Floor Price</th>
                      <th className="px-5 py-3 w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-medium text-slate-700 ">
                    {ledgerItems.map((item: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100  last:border-0 hover:bg-[#f8fafc] :bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-5 py-2.5">
                          <div className="w-7 h-7 bg-slate-100  rounded flex items-center justify-center overflow-hidden">
                            {getImg(item) ? (
                              <img
                                src={getImg(item)}
                                alt=""
                                className="w-full h-full object-cover mix-blend-multiply  opacity-70 group-hover:opacity-100 transition-opacity"
                              />
                            ) : (
                              <span className="text-slate-400  block text-[10px]">
                                #
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[#0f172a]  font-semibold truncate max-w-[250px]">
                          {item.product.name}
                          <div className="font-mono text-[9px] text-slate-400 font-normal">
                            ID: {item.product.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[11px] text-slate-500">
                          {item.product.category || "N/A"}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                            {formatSmallInt(item.availableQty)}
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-[#0f172a] ">
                          {formatPrice(item.minPrice)}
                          <span className="text-[10px] text-slate-400 font-sans ml-0.5">
                            ₺
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <Link
                            href={`/catalog/${item.product.id}`}
                            className="text-[10px] font-bold text-indigo-600  hover:text-indigo-700 :text-indigo-300 uppercase tracking-widest border border-indigo-200  bg-indigo-50  px-3 py-1.5 rounded hover:bg-indigo-100 :bg-indigo-500/20 transition-colors inline-block"
                          >
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
