import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AddToCartButton from "./AddToCartButton";
import { ArrowLeft, Box, CheckCircle2, Package, ShoppingCart, Truck, AlertCircle, BarChart3, ArrowRight, Clock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const { productId } = await params;

    const product = await prisma.globalProduct.findUnique({
        where: { id: productId },
    });

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200 dark:border-white/10">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Ağ Ürünü Bulunamadı</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Aradığınız ürün katalogdan kaldırılmış veya sisteme erişim yetkiniz kısıtlı olabilir.</p>
                    <Link href="/catalog" className="inline-flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                        Kataloğa Geri Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Use prismaRaw to entirely bypass the strict tenant isolation RLS for B2B Network discovery.
    // Otherwise, nested relations like `include: { company: true }` will be silently filtered out for other tenants, causing UI crashes.
    const listings = await prismaRaw.networkListing.findMany({
        where: { globalProductId: productId, status: "ACTIVE" },
        include: { company: true },
        orderBy: { price: "asc" }
    });

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">

                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
                    <Link href="/catalog" className="hover:text-slate-900 dark:hover:text-white transition-colors">B2B Ortak Katalog</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{product.name}</span>
                </div>

                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <Package className="w-6 h-6 text-indigo-500" />
                            Ağ Ürün Detayı
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/catalog/cart" className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-white/10 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm shrink-0">
                            <ShoppingCart className="w-4 h-4" />
                            Sepete Git
                        </Link>
                        <Link href="/catalog" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0">
                            <ArrowLeft className="w-4 h-4" />
                            Kataloğa Dön
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* LEFT COL: Product General Info */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                            {(() => {
                                const imgSafe = (product as any).imageUrl || (product as any).image || ((product as any).images && (product as any).images[0]) || (product as any).coverImage || (product as any).thumbnail;
                                if (imgSafe) {
                                    return <img src={imgSafe} alt={product.name} className="w-full aspect-square object-cover rounded-xl border border-slate-200 dark:border-white/10 mb-5 shadow-sm bg-white" />;
                                }
                                return (
                                    <div className="w-full aspect-[4/3] bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-white/5 rounded-xl flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 font-bold mb-5 shadow-inner">
                                        <Box className="w-16 h-16 opacity-50 mb-3" />
                                        <span className="text-[10px] uppercase tracking-widest text-slate-400">Görsel Eklenmemiş</span>
                                    </div>
                                );
                            })()}

                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
                                {product.name}
                            </h1>
                            
                            <div className="w-full bg-slate-50 dark:bg-[#0f172a] rounded-xl p-4 border border-slate-100 dark:border-white/5 text-left space-y-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Global Barkod</span> 
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{product.barcode || 'Belirtilmemiş'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Kategori</span> 
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{product.category || 'Kategorisiz'}</span>
                                </div>
                            </div>

                        </div>

                        {product.description && (
                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    Teknik Özellikler
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    {product.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: Sellers Matrix */}
                    <div className="xl:col-span-3">
                        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col h-full overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-emerald-500" />
                                        Bu Ürünü Sağlayan Tedarikçiler
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">B2B ağındaki aktif satıcılardan fiyat, stok ve kurşun süresine (lead time) göre karşılaştırmalı sipariş verin.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {listings.length} Satıcı Bulundu
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse">
                                    <thead className="bg-slate-800 dark:bg-slate-900 text-white">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Ağ Satıcısı (Tedarikçi)</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">Birim Fiyat (TL)</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-center">Ağ Stoğu</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-center">Kurşun Süresi</th>
                                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-center w-32">Operasyon</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {listings.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                                    <p className="font-bold text-slate-700 dark:text-slate-300">Ağ üzerinde aktif satıcı bulunmuyor.</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Şu anda bu ürün için stok bildiren bir firma yok. RFQ açabilirsiniz.</p>
                                                    <div className="mt-4">
                                                        <Link href="/rfq/create" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                                                            İhale / Fiyat Talebi (RFQ) Başlat <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            listings.map((l: any, index: number) => {
                                                const isOOS = l.availableQty < l.minQty;
                                                const isNotReady = !l.price || Number(l.price) === 0;
                                                const isBestPrice = index === 0 && !isOOS && !isNotReady;

                                                const rawName = l.company?.name || "Kayıtsız Tedarikçi";
                                                const shortName = rawName.length > 25 ? rawName.substring(0, 25) + "..." : rawName;

                                                return (
                                                    <tr key={l.id} className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group ${isOOS ? 'opacity-60 bg-slate-50 dark:bg-slate-900/50 grayscale-[50%]' : ''}`}>
                                                        <td className="px-6 py-3">
                                                            <div className="flex flex-col">
                                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2" title={rawName}>
                                                                    {shortName}
                                                                    {isBestPrice && (
                                                                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 uppercase tracking-widest hidden sm:inline-block shrink-0">En İyi Fiyat</span>
                                                                    )}
                                                                </div>
                                                                {l.minQty > 1 && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-wider">Min: <span className="font-bold text-slate-700 dark:text-slate-300">{l.minQty} Adet</span></div>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 font-mono font-bold text-right text-slate-900 dark:text-emerald-400 text-base">
                                                            {isNotReady ? <span className="text-sm text-slate-400">Fiyat Yok</span> : `${Number(l.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            {l.availableQty >= l.minQty ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 font-mono text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                                                                    {l.availableQty}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 font-mono text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-500/20">
                                                                    {l.availableQty > 0 ? `Stok Az (${l.availableQty})` : 'Tükendi'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <div className="inline-flex items-center justify-center bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                                                {l.leadTimeDays === 0 ? (
                                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Truck className="w-3 h-3" /> Aynı Gün</span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {l.leadTimeDays} Gün İçinde</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-center w-40">
                                                            {l.sellerCompanyId === user.companyId ? (
                                                                <span className="inline-flex items-center justify-center py-2 px-3 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-bold text-[10px] rounded-xl cursor-not-allowed border border-slate-200 dark:border-white/10 uppercase tracking-widest w-full text-center">
                                                                    Sizin İlanınız
                                                                </span>
                                                            ) : (
                                                                <AddToCartButton
                                                                    productId={product.id}
                                                                    sellerCompanyId={l.sellerCompanyId}
                                                                    maxQty={l.availableQty}
                                                                    disabled={isOOS || isNotReady}
                                                                />
                                                            )}
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

            </div>
        </div>
    );
}
