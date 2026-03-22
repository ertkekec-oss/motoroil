"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useModal } from "@/contexts/ModalContext"
import { PackageOpen, Search, Filter, ShoppingCart, Info, Loader2, Plus, Check, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function NetworkCatalogPage() {
    const { showError, showSuccess } = useModal()
    const router = useRouter()
    const [q, setQ] = useState("")
    const [debouncedQ, setDebouncedQ] = useState("")
    const [activeCat, setActiveCat] = useState<string>("")
    const [categories, setCategories] = useState<string[]>([])
    const [banners, setBanners] = useState<any[]>([])
    const [bannersLoading, setBannersLoading] = useState(true)
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [addingToCart, setAddingToCart] = useState<string | null>(null)
    const [hideB2bPrice, setHideB2bPrice] = useState(false)
    const [mainBannerIndex, setMainBannerIndex] = useState(0)
    const [sideBannerIndex, setSideBannerIndex] = useState(0)
    const [featuredIndex, setFeaturedIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setFeaturedIndex(prev => prev + 1);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setHideB2bPrice(localStorage.getItem('hideB2bPrice') === 'true')
    }, [])

    useEffect(() => {
        if (!banners || banners.length === 0) return;
        const mainBanners = banners.filter(b => b.placement !== 'side');
        const sideBanners = banners.filter(b => b.placement === 'side');
        const timer = setInterval(() => {
            if (mainBanners.length > 1) setMainBannerIndex(prev => (prev + 1) % mainBanners.length);
            if (sideBanners.length > 1) setSideBannerIndex(prev => (prev + 1) % sideBanners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners]);
    
    const toggleHideB2bPrice = () => {
        const newVal = !hideB2bPrice;
        setHideB2bPrice(newVal);
        localStorage.setItem('hideB2bPrice', String(newVal));
    }

    useEffect(() => {
        fetch("/api/network/catalog/categories")
            .then(res => res.json())
            .then(data => { if (data.ok) setCategories(data.categories || []) })
            .catch(() => {})

        fetch(`/api/network/catalog/banners?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => { if (data.ok) setBanners(data.banners || []) })
            .catch(() => {})
            .finally(() => setBannersLoading(false))
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q), 400)
        return () => clearTimeout(timer)
    }, [q])

    useEffect(() => {
        fetchCatalog()
    }, [debouncedQ, activeCat, page])

    useEffect(() => { setPage(1) }, [debouncedQ, activeCat])

    const fetchCatalog = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/network/catalog?q=${encodeURIComponent(debouncedQ)}&category=${encodeURIComponent(activeCat)}&page=${page}&take=40`)
            const data = await res.json()
            if (res.ok && data.ok) {
                setProducts(data.products || [])
                if (data.pagination) setTotalPages(data.pagination.totalPages || 1)
            } else {
                showError("Katalog", "Ürünler yüklenemedi")
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası")
        } finally {
            setLoading(false)
        }
    }

    const addToCart = async (p: any, qty: number) => {
        setAddingToCart(p.id)
        try {
            const res = await fetch("/api/network/cart/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: p.id, quantity: qty, catalogItemId: p.catalogItemId })
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok && (data.ok || !data.error)) {
                window.dispatchEvent(new Event('cart_update'));
                showSuccess("Sepet", `${qty} adet ${p.name} eklendi.`)
            } else {
                showError("Sepet", data.error || "Hata")
            }
        } catch (e: any) {
            showError("Hata", "Hata")
        } finally {
            setAddingToCart(null)
        }
    }

    const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

    const isHomePage = activeCat === "" && debouncedQ === "";
    const imageProducts = products.filter(p => !!p.image);
    const noImageProducts = products.filter(p => !p.image);

    return (
        <div className="font-sans min-h-[calc(100vh-64px)] bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-6 py-10 space-y-8">
                
                {/* 1. BANNERS ROW */}
                {!bannersLoading && banners.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {banners.filter(b => b.placement !== 'side').length > 0 && (
                            <div className={`w-full relative overflow-hidden rounded-2xl flex bg-white group shadow-sm transition-all ${banners.some(b => b.placement === 'side') ? 'md:col-span-3' : 'md:col-span-4'}`} style={{ aspectRatio: '1200/420' }}>
                                {(() => {
                                    const mainBanners = banners.filter(b => b.placement !== 'side');
                                    const current = mainBanners[mainBannerIndex % mainBanners.length];
                                    return (
                                        <div key={current.id} className="w-full h-full animate-in fade-in duration-700 absolute inset-0 cursor-pointer" onClick={() => { if(current.linkUrl) window.open(current.linkUrl, '_blank') }}>
                                            <img src={current.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        {banners.filter(b => b.placement === 'side').length > 0 && (
                            <div className="hidden md:flex md:col-span-1 w-full relative overflow-hidden rounded-2xl bg-white shadow-sm" style={{ aspectRatio: '380/420' }}>
                                {(() => {
                                    const sideBanners = banners.filter(b => b.placement === 'side');
                                    const current = sideBanners[sideBannerIndex % sideBanners.length];
                                    return (
                                        <div key={current.id} className="w-full h-full animate-in fade-in duration-700 absolute inset-0 cursor-pointer" onClick={() => { if(current.linkUrl) window.open(current.linkUrl, '_blank') }}>
                                            <img src={current.imageUrl} alt="Side" className="w-full h-full object-cover" />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. SEARCH & FILTERS */}
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center gap-2">
                        <button onClick={() => setActiveCat("")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-slate-200 ${activeCat === "" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600"}`}>Tümü</button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCat(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-slate-200 ${activeCat === cat ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600"}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleHideB2bPrice} className="h-10 px-3 rounded-xl bg-white border border-slate-200 shadow-sm">{hideB2bPrice ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Stok kodu (SKU) veya ürün adı girin..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                        </div>
                    </div>
                </div>

                {/* 3. CORE CONTENT GRID */}
                <div className="pt-4">
                    {loading ? (
                        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : (
                        <div className="space-y-12">
                            {isHomePage ? (
                                <>
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {imageProducts.slice(0, 2).map(p => <ProductCard key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />)}
                                        </div>
                                        {imageProducts.length > 2 && (
                                            <div className="lg:col-span-2">
                                                {(() => {
                                                    const feat = imageProducts[featuredIndex % Math.min(imageProducts.length, 5)];
                                                    return <FeaturedCardHorizontal p={feat} router={router} addingToCart={addingToCart} addToCart={addToCart} fmt={fmt} />
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    {imageProducts.length > 5 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <BestSellerBox p={imageProducts[5]} router={router} addingToCart={addingToCart} addToCart={addToCart} fmt={fmt} />
                                            {imageProducts.length > 6 && <BestSellerBox p={imageProducts[6]} router={router} addingToCart={addingToCart} addToCart={addToCart} fmt={fmt} />}
                                        </div>
                                    )}

                                    {imageProducts.length > 7 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {imageProducts.slice(7, 11).map(p => <ProductCard key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />)}
                                        </div>
                                    )}

                                    {noImageProducts.length > 0 && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                                            <div className="space-y-3">
                                                {noImageProducts.slice(0, 4).map(p => <ProductRowItem key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />)}
                                            </div>
                                            <div className="space-y-3">
                                                {noImageProducts.slice(4, 8).map(p => <ProductRowItem key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />)}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {products.map(p => <ProductCard key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />)}
                                </div>
                            )}

                            {!isHomePage && totalPages > 1 && (
                                <div className="flex justify-center gap-4 mt-10">
                                    <button disabled={page === 1} onClick={() => setPage(page-1)} className="px-4 py-2 border border-slate-200 rounded bg-white">Geri</button>
                                    <span className="py-2 text-sm font-bold text-slate-500">Sayfa {page}/{totalPages}</span>
                                    <button disabled={page === totalPages} onClick={() => setPage(page+1)} className="px-4 py-2 border border-slate-200 rounded bg-white">İleri</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ProductCard({ p, router, addingToCart, addToCart, hideB2bPrice, fmt }: any) {
    const stockStatus = p.stock > 0 ? "bg-emerald-500" : "bg-rose-500";
    const stockText = p.stock > 0 ? `${p.stock} adet` : "Tükendi";
    
    return (
        <div className="bg-white rounded-[16px] p-5 flex flex-col h-[480px] border border-slate-200 shadow-sm transition-all group relative">
            <div className="min-h-[220px] max-h-[220px] bg-white rounded-xl mb-4 flex items-center justify-center relative border border-slate-50">
                <img src={p.image} className="max-h-[180px] max-w-[180px] object-contain" />
                {p.campaign && (
                    <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-md border border-emerald-200 shadow-sm uppercase z-10">
                        {p.campaign.buyQuantity + p.campaign.rewardQuantity} AL {p.campaign.buyQuantity} ÖDE
                    </div>
                )}
            </div>
            
            <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded tracking-tight">{p.sku}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded tracking-tight uppercase">{p.category || "DİĞER"}</span>
                </div>
                <h3 className="text-[14px] font-bold text-slate-800 line-clamp-2 h-10">{p.name}</h3>
                <div className="flex items-center gap-1.5 mt-auto">
                    <div className={`w-2 h-2 rounded-full ${stockStatus}`} />
                    <span className="text-[11px] font-bold text-slate-500">Stok: {stockText}</span>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <div className="flex flex-col">
                    {!hideB2bPrice && (
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5" title="Liste Fiyatı">
                            L. Fiyatı: <span className="line-through">{fmt(p.basePrice || p.priceResolved)}</span>
                        </div>
                    )}
                    <span className="text-xl font-black text-slate-900 tracking-tight leading-none">{fmt(p.priceResolved)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => router.push('/network/catalog/' + p.id)}
                        className="w-[42px] h-[42px] bg-white text-slate-400 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all"
                    >
                        <Search size={18} />
                    </button>
                    <button 
                        disabled={addingToCart === p.id}
                        onClick={() => addToCart(p, 1)}
                        className={`h-[42px] px-5 bg-white border border-blue-400 text-blue-600 rounded-xl hover:bg-blue-50 active:scale-95 transition-all text-[12px] font-bold flex items-center gap-2 ${addingToCart === p.id ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : ''}`}
                    >
                        {addingToCart === p.id ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                        {addingToCart === p.id ? 'EKLENDİ' : 'Ekle'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function FeaturedCardHorizontal({ p, router, addingToCart, addToCart, fmt }: any) {
    return (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex h-[480px] overflow-hidden group">
            <div className="w-[45%] bg-white p-8 flex items-center justify-center shrink-0 border-r border-slate-100 relative">
                <img src={p.image} className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-5 py-2 rounded-full shadow-lg">VİTRİN ÖZEL</span>
                </div>
                {p.campaign && (
                    <div className="absolute top-6 right-6 bg-emerald-100 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-200 uppercase">
                        KAMPANYA AKTİF
                    </div>
                )}
            </div>
            <div className="flex-1 p-10 flex flex-col justify-center">
                <div className="flex gap-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded">{p.sku}</span>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded uppercase">{p.category}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-5 leading-tight">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-10 line-clamp-3 leading-relaxed">{p.b2bDescription || p.description || "Periodya özel katalog ürünü."}</p>
                <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">MÜŞTERİ ÖZEL FİYATI</span>
                        <div className="text-3xl font-black text-indigo-600 tracking-tight">{fmt(p.priceResolved)}</div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => router.push('/network/catalog/' + p.id)} className="h-14 px-8 border border-slate-200 rounded-2xl font-black text-xs text-slate-600 hover:bg-slate-50">DETAY</button>
                        <button onClick={() => addToCart(p, 1)} className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100">SEPETE EKLE</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function BestSellerBox({ p, router, addingToCart, addToCart, fmt }: any) {
    return (
        <div className="bg-white rounded-[24px] border border-slate-200 p-5 flex items-center gap-6 shadow-sm hover:shadow-md transition-all group h-[160px]">
            <div className="w-24 h-24 bg-white border border-slate-50 rounded-xl p-3 shrink-0 flex items-center justify-center relative">
                <img src={p.image} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-indigo-500 tracking-[0.2em] uppercase mb-1.5 block">HER AYIN FAVORİSİ</span>
                <h4 className="text-[15px] font-black text-slate-800 truncate mb-2">{p.name}</h4>
                <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-900">{fmt(p.priceResolved)}</span>
                    <button onClick={() => addToCart(p, 1)} className="h-10 px-6 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all ml-auto">Ekle</button>
                </div>
            </div>
        </div>
    )
}

function ProductRowItem({ p, router, addingToCart, addToCart, hideB2bPrice, fmt }: any) {
    return (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100 shadow-sm transition-all group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-50 text-slate-400 font-bold text-[10px]">NO IMG</div>
                <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{p.sku}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[9px] font-bold text-slate-400">Stok: {p.stock > 0 ? `${p.stock} ad.` : "Yok"}</span>
                    </div>
                    <h5 className="text-[13px] font-bold text-slate-800 truncate">{p.name}</h5>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    {!hideB2bPrice && <div className="text-[9px] text-slate-300 font-bold line-through leading-none mb-0.5">{fmt(p.basePrice || p.priceResolved)}</div>}
                    <span className="text-[14px] font-black text-slate-900 tracking-tight">{fmt(p.priceResolved)}</span>
                </div>
                <button onClick={() => addToCart(p, 1)} className="w-[42px] h-[42px] rounded-xl border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-all">
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>
        </div>
    )
}
