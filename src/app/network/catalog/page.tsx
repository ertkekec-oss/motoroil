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
            const res = await fetch(`/api/network/catalog?q=${encodeURIComponent(debouncedQ)}&category=${encodeURIComponent(activeCat)}&page=${page}&take=30`)
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
                        <button onClick={() => setActiveCat("")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${activeCat === "" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>Tümü</button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCat(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${activeCat === cat ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleHideB2bPrice} className="h-10 px-3 rounded-xl bg-white shadow-sm">{hideB2bPrice ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ara..." className="w-full pl-10 pr-4 py-2 bg-white border-0 shadow-sm rounded-xl text-sm" />
                        </div>
                    </div>
                </div>

                {/* 3. CORE CONTENT GRID */}
                <div className="pt-4">
                    {loading ? (
                        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : products.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">Ürün Yok</div>
                    ) : (
                        <div className="space-y-12">
                            {isHomePage ? (
                                <>
                                    {/* SECTION 1: 2 Regular + 1 Featured (Horizontal) */}
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

                                    {/* SECTION 2: 2 Best Sellers Horizontal (YAN YANA) */}
                                    {imageProducts.length > 5 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <BestSellerBox p={imageProducts[5]} router={router} addingToCart={addingToCart} addToCart={addToCart} fmt={fmt} />
                                            {imageProducts.length > 6 && <BestSellerBox p={imageProducts[6]} router={router} addingToCart={addingToCart} addToCart={addToCart} fmt={fmt} />}
                                        </div>
                                    )}

                                    {/* SECTION 3: 4 Regular Cards */}
                                    {imageProducts.length > 7 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {imageProducts.slice(7, 11).map(p => <ProductCard key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />)}
                                        </div>
                                    )}

                                    {/* SECTION 4: List View Products (No Image) */}
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
                                    <button disabled={page === 1} onClick={() => setPage(page-1)} className="px-4 py-2 shadow-sm rounded bg-white">Geri</button>
                                    <span className="py-2">Sayfa {page}/{totalPages}</span>
                                    <button disabled={page === totalPages} onClick={() => setPage(page+1)} className="px-4 py-2 shadow-sm rounded bg-white">İleri</button>
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
    return (
        <div className="bg-white rounded-2xl p-4 flex flex-col h-[440px] shadow-sm hover:shadow-md transition-all">
            <div className="h-44 bg-slate-50/50 rounded-xl mb-4 p-4 flex items-center justify-center relative overflow-hidden">
                <img src={p.image} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                {p.campaign && <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded">KAMPANYA</div>}
            </div>
            <div className="flex flex-wrap gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{p.sku}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase">{p.category}</span>
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 line-clamp-2 h-10 mb-auto">{p.name}</h3>
            
            <div className="pt-4 border-t mt-4">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-0.5">
                        {!hideB2bPrice && (
                            <div className="text-[10px] text-slate-400 font-bold uppercase leading-none">
                                L. Fiyatı: <span className="line-through">{fmt(p.basePrice || p.priceResolved)}</span>
                            </div>
                        )}
                        <span className="text-lg font-black text-slate-900 leading-none">{fmt(p.priceResolved)}</span>
                    </div>
                    <div className="flex gap-1.5">
                        <button 
                            onClick={() => router.push('/network/catalog/' + p.id)}
                            className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200"
                        >
                            <Search size={16} />
                        </button>
                        <button 
                            disabled={addingToCart === p.id}
                            onClick={() => addToCart(p, 1)}
                            className="h-10 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 text-[10px] font-black flex items-center gap-2"
                        >
                            {addingToCart === p.id ? <Check size={14} /> : <Plus size={14} />}
                            {addingToCart === p.id ? 'EKLENDİ' : 'SEPETE EKLE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeaturedCardHorizontal({ p, router, addingToCart, addToCart, fmt }: any) {
    return (
        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 flex h-[440px] overflow-hidden group">
            <div className="w-[45%] bg-slate-50/50 p-8 flex items-center justify-center shrink-0 border-r border-slate-50 relative overflow-hidden">
                <img src={p.image} className="w-full h-full object-contain filter drop-shadow-xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">VİTRİN ÖZEL</span>
                </div>
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-slate-400 mb-2">{p.sku}</span>
                <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-8 line-clamp-3 leading-relaxed">{p.b2bDescription || p.description || "Periodya özel katalog ürünü."}</p>
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Size Özel Fiyat</span>
                        <div className="text-2xl font-black text-indigo-600 tracking-tight">{fmt(p.priceResolved)}</div>
                    </div>
                    <button 
                        onClick={() => addToCart(p, 1)}
                        className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                        SEPETE EKLE
                    </button>
                </div>
            </div>
        </div>
    )
}

function BestSellerBox({ p, router, addingToCart, addToCart, fmt }: any) {
    return (
        <div className="bg-white rounded-[24px] p-4 flex items-center gap-6 shadow-sm hover:shadow-md transition-all group overflow-hidden h-[160px]">
            <div className="w-24 h-24 bg-slate-50 rounded-xl p-3 shrink-0 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
                <img src={p.image} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-indigo-500 tracking-[0.2em] uppercase mb-1 block">HER AYIN FAVORİSİ</span>
                <h4 className="text-[15px] font-black text-slate-800 truncate mb-1">{p.name}</h4>
                <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-900">{fmt(p.priceResolved)}</span>
                    <button onClick={() => addToCart(p, 1)} className="h-9 px-4 bg-indigo-600 text-white rounded-xl font-black text-[9px] hover:bg-indigo-700 transition-all ml-auto">EKLE</button>
                </div>
            </div>
        </div>
    )
}

function ProductRowItem({ p, router, addingToCart, addToCart, hideB2bPrice, fmt }: any) {
    return (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between hover:border-indigo-100 border border-transparent shadow-sm transition-all group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-50 text-slate-400 font-bold text-[10px]">NO IMG</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{p.sku}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                    <h5 className="text-[13px] font-bold text-slate-800 truncate">{p.name}</h5>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    {!hideB2bPrice && <div className="text-[9px] text-slate-300 line-through leading-none">{fmt(p.basePrice || p.priceResolved)}</div>}
                    <span className="text-[14px] font-black text-slate-900">{fmt(p.priceResolved)}</span>
                </div>
                <button onClick={() => addToCart(p, 1)} className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                    <Plus size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    )
}
