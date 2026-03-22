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
        // Randomize featured product on each mount/load
        setFeaturedIndex(Math.floor(Math.random() * 1000))
    }, [])

    useEffect(() => {
        setHideB2bPrice(localStorage.getItem('hideB2bPrice') === 'true')
    }, [])

    useEffect(() => {
        if (!banners || banners.length === 0) return;
        
        const mainBanners = banners.filter(b => b.placement !== 'side');
        const sideBanners = banners.filter(b => b.placement === 'side');
        
        const timer = setInterval(() => {
            if (mainBanners.length > 1) {
                setMainBannerIndex(prev => (prev + 1) % mainBanners.length);
            }
            if (sideBanners.length > 1) {
                setSideBannerIndex(prev => (prev + 1) % sideBanners.length);
            }
        }, 5000);
        
        return () => clearInterval(timer);
    }, [banners]);
    
    const toggleHideB2bPrice = () => {
        const newVal = !hideB2bPrice;
        setHideB2bPrice(newVal);
        localStorage.setItem('hideB2bPrice', String(newVal));
    }

    // Load categories & banners once
    useEffect(() => {
        fetch("/api/network/catalog/categories")
            .then(res => res.json())
            .then(data => {
                if (data.ok) setCategories(data.categories || [])
            })
            .catch(() => {})

        fetch(`/api/network/catalog/banners?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                if (data.ok) setBanners(data.banners || [])
            })
            .catch(() => {})
            .finally(() => setBannersLoading(false))
    }, [])

    // Debounce typing specifically
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q), 400)
        return () => clearTimeout(timer)
    }, [q])

    // Fetch immediately on relevant state changes
    useEffect(() => {
        fetchCatalog()
    }, [debouncedQ, activeCat, page])

    // Reset pagination ONLY when search or category changes, not on page changes!
    useEffect(() => { setPage(1) }, [debouncedQ, activeCat])

    const fetchCatalog = async () => {
        setLoading(true)
        try {
            // we use debouncedQ here
            const res = await fetch(`/api/network/catalog?q=${encodeURIComponent(debouncedQ)}&category=${encodeURIComponent(activeCat)}&page=${page}&take=16`)
            const data = await res.json()
            if (res.ok && data.ok) {
                setProducts(data.products || [])
                if (data.pagination) setTotalPages(data.pagination.totalPages || 1)
            } else {
                showError("Katalog", "Ürünler yüklenemedi: " + (data.error || "Bilinmeyen hata"))
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası: " + e.message)
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
                body: JSON.stringify({
                    productId: p.id,
                    quantity: qty,
                    catalogItemId: p.catalogItemId
                })
            })

            const data = await res.json().catch(() => ({}))
            if (res.ok && (data.ok || !data.error)) {
                window.dispatchEvent(new Event('cart_update'));
                showSuccess("Sepet", `${qty} adet ${p.name} sepete eklendi.`)
            } else {
                showError("Sepet", data.error || "Ürün sepete eklenemedi.")
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası: " + e.message)
        } finally {
            // Remove artificial 1 second delay so the button feels instantly responsive
            setAddingToCart(null)
        }
    }

    const imageProducts = products.filter((p: any) => !!p.image).slice(0, 8);
    const noImageProducts = products.filter((p: any) => !p.image);
    const leftList = noImageProducts.slice(0, Math.ceil(noImageProducts.length / 2));
    const rightList = noImageProducts.slice(Math.ceil(noImageProducts.length / 2));

    return (
        <div className="font-sans min-h-[calc(100vh-64px)] bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-6 py-10 space-y-8">
                
                {/* 1. BANNERS ROW */}
                {bannersLoading ? (
                    <div className="w-full rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center shadow-sm" style={{ aspectRatio: '1200/420' }}>
                        <span className="text-slate-400 font-medium text-sm hidden md:inline-block">Katalog Yükleniyor...</span>
                    </div>
                ) : banners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Alan 1 (Main Banner Carousel) */}
                        {banners.filter(b => b.placement !== 'side').length > 0 && (
                            <div className={`w-full relative overflow-hidden rounded-2xl flex bg-slate-100 group shadow-sm transition-all ${banners.some(b => b.placement === 'side') ? 'md:col-span-3' : 'md:col-span-4'}`} style={{ aspectRatio: '1200/420' }}>
                                {(() => {
                                    const mainBanners = banners.filter(b => b.placement !== 'side');
                                    const current = mainBanners[mainBannerIndex % mainBanners.length];
                                    
                                    return (
                                        <>
                                            <div key={current.id} className="w-full h-full animate-in fade-in duration-700 absolute inset-0 cursor-pointer" onClick={() => { if(current.linkUrl) window.open(current.linkUrl, '_blank') }}>
                                                <img src={current.imageUrl} alt="Main Banner" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                            </div>
                                            
                                            {mainBanners.length > 1 && (
                                                <>
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
                                                        {mainBanners.map((_, idx) => (
                                                            <button 
                                                                key={idx} 
                                                                onClick={(e) => { e.stopPropagation(); setMainBannerIndex(idx); }}
                                                                className={`w-2 h-2 rounded-full transition-all ${idx === (mainBannerIndex % mainBanners.length) ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide z-10">
                                                        {(mainBannerIndex % mainBanners.length) + 1} / {mainBanners.length}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Alan 2 (Side Banner Carousel) */}
                        {banners.filter(b => b.placement === 'side').length > 0 && (
                            <div className={`hidden md:flex w-full relative overflow-hidden rounded-2xl bg-slate-100 group shadow-sm transition-all ${banners.filter(b => b.placement !== 'side').length === 0 ? 'md:col-span-4' : 'md:col-span-1'}`} style={{ aspectRatio: banners.filter(b => b.placement !== 'side').length === 0 ? '1200/420' : '380/420' }}>
                                {(() => {
                                    const sideBanners = banners.filter(b => b.placement === 'side');
                                    const current = sideBanners[sideBannerIndex % sideBanners.length];
                                    
                                    return (
                                        <>
                                            <div key={current.id} className="w-full h-full animate-in fade-in duration-700 absolute inset-0 cursor-pointer" onClick={() => { if(current.linkUrl) window.open(current.linkUrl, '_blank') }}>
                                                <img src={current.imageUrl} alt="Side Banner" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                                            </div>
                                            
                                            {sideBanners.length > 1 && (
                                                <>
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full z-10">
                                                        {sideBanners.map((_, idx) => (
                                                            <button 
                                                                key={idx} 
                                                                onClick={(e) => { e.stopPropagation(); setSideBannerIndex(idx); }}
                                                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === (sideBannerIndex % sideBanners.length) ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                ) : null}

                {/* 2. SEARCH BAR & FILTERS ROW */}
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4">
                    {/* CATEGORY FILTERS */}
                    <div className="flex-1 w-full overflow-hidden">
                        {categories.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 custom-scroll scroll-smooth" style={{ scrollbarWidth: "none" }}>
                                <button
                                    onClick={() => setActiveCat("")}
                                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 border shrink-0
                                        ${activeCat === "" 
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                        }`}
                                >
                                    Tümü
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCat(cat)}
                                        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 border shrink-0
                                            ${activeCat === cat 
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <button
                            onClick={toggleHideB2bPrice}
                            className="h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm"
                            title={hideB2bPrice ? "B2B Fiyatını Göster" : "B2B Fiyatını Gizle"}
                        >
                            {hideB2bPrice ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <div className="w-full md:w-[350px] relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={1.5} />
                            </div>
                            <input
                                type="text"
                                placeholder="Stok kodu (SKU) veya ürün adı girin..."
                                className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-10 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-1.5 flex items-center">
                                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                    <Filter className="h-4 w-4" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>



                {/* 2. PRODUCT GRID */}
                <div className="pt-4 border-t border-slate-200/60">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <div className="text-[14px] font-medium text-slate-500 tracking-wide">Katalog Yükleniyor...</div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                <PackageOpen className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ürün Bulunamadı</h3>
                            <p className="text-[14px] text-slate-500 max-w-sm">
                                Aramanıza uygun herhangi bir ürün bulunamadı. Lütfen filtreleri veya arama terimini değiştirerek tekrar deneyin.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-12">
                                {/* Grid Array (First 8 items with image or just the first 8) */}
                                <>
                                            {imageProducts.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {(() => {
                                                        const firstRow = imageProducts.slice(0, 4);
                                                        const remaining = imageProducts.slice(4);
                                                        const useFeatured = page === 1 && firstRow.length >= 3;
                                                        const featuredProduct = firstRow[featuredIndex % firstRow.length];
                                                        const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

                                                        return (
                                                            <>
                                                                {/* First Two Products (Regular) */}
                                                                {firstRow.slice(0, 2).map(p => (
                                                                    <ProductCard key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />
                                                                ))}

                                                                {/* Featured Wide Product (Slots 3 & 4) */}
                                                                {useFeatured ? (
                                                                    <div className="md:col-span-2 bg-white rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row relative group/feat border border-slate-200 h-[435px]">
                                                                        {/* Background Decorative Element */}
                                                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-70" />
                                                                        
                                                                        {/* Image Part */}
                                                                        <div className="w-full md:w-[42%] bg-slate-50 p-8 flex items-center justify-center relative overflow-hidden shrink-0 border-r border-slate-100">
                                                                            <img src={featuredProduct.image} alt={featuredProduct.name} className="w-full h-full object-contain filter drop-shadow-md group-hover/feat:scale-110 transition-transform duration-700 mix-blend-multiply" />
                                                                            {featuredProduct.campaign && (
                                                                                <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest z-10">
                                                                                    GÜNÜN FIRSATI
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Content Part */}
                                                                        <div className="flex-1 p-6 md:p-8 flex flex-col relative bg-white">
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-2 py-0.5 rounded">Vitrindeki Ürün</span>
                                                                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                                                                <span className="text-[10px] font-bold text-slate-400">{featuredProduct.sku}</span>
                                                                            </div>
                                                                            
                                                                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-4 group-hover/feat:text-indigo-600 transition-colors line-clamp-2">
                                                                                {featuredProduct.name}
                                                                            </h3>

                                                                            {featuredProduct.description ? (
                                                                                <p className="text-sm text-slate-500 line-clamp-3 mb-6 font-medium leading-relaxed">
                                                                                    {featuredProduct.description}
                                                                                </p>
                                                                            ) : (
                                                                                <p className="text-sm text-slate-400 italic mb-6">Bu ürün için özel açıklama bulunmamaktadır.</p>
                                                                            )}

                                                                            <div className="mt-auto flex flex-col gap-5">
                                                                                {featuredProduct.pointsRate > 0 && (
                                                                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                                                                                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm text-white">
                                                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Kazanılacak Parapuan</div>
                                                                                            <div className="text-lg font-black text-emerald-700 leading-none">
                                                                                                +{Math.floor(featuredProduct.priceResolved * featuredProduct.pointsRate).toLocaleString('tr-TR')} <span className="text-xs font-bold">PUAN</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Birim Fiyat</span>
                                                                                        <div className="flex items-baseline gap-2">
                                                                                            <span className="text-2xl font-black text-slate-900 tracking-tighter">
                                                                                                {fmt(featuredProduct.priceResolved)}
                                                                                            </span>
                                                                                            {!hideB2bPrice && featuredProduct.basePrice && featuredProduct.basePrice > featuredProduct.priceResolved && (
                                                                                                <span className="text-sm font-medium text-slate-400 line-through">
                                                                                                    {fmt(featuredProduct.basePrice)}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-2">
                                                                                        <button 
                                                                                            onClick={() => router.push('/network/catalog/' + featuredProduct.id)}
                                                                                            className="h-11 px-5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                                                                                        >
                                                                                            Detay
                                                                                        </button>
                                                                                        <button 
                                                                                            disabled={addingToCart === featuredProduct.id || featuredProduct.stock <= 0}
                                                                                            onClick={() => addToCart(featuredProduct, 1)}
                                                                                            className={`h-11 px-5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-sm ${addingToCart === featuredProduct.id ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                                                                        >
                                                                                            {addingToCart === featuredProduct.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                                                            Ekle
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // Fallback if not enough products for featured or not on page 1
                                                                    firstRow.slice(2, 4).map(p => (
                                                                        <ProductCard key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />
                                                                    ))
                                                                )}

                                                                {/* Remaining Products */}
                                                                {remaining.map(p => (
                                                                    <ProductCard key={p.id} p={p} router={router} addingToCart={addingToCart} addToCart={addToCart} hideB2bPrice={hideB2bPrice} fmt={fmt} />
                                                                ))}
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            )}

                                            {noImageProducts.length > 0 && (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                                                    {/* Left List */}
                                                    <div className="flex flex-col gap-3">
                                                        {leftList.map(p => (
                                                            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 transition-colors shadow-sm relative overflow-hidden group">
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                                                                {p.campaign && (
                                                                    <div className="absolute top-0 right-0 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border-b border-l border-emerald-200 px-2 py-0.5 rounded-bl-xl flex items-center shadow-sm uppercase tracking-wide z-10">
                                                                        {p.campaign.buyQuantity + p.campaign.rewardQuantity} AL {p.campaign.buyQuantity} ÖDE
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0 pl-1">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">{p.sku || "N/A"}</span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded truncate max-w-[100px]">{p.category || "Diğer"}</span>
                                                                        <div className={`ml-auto w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                    </div>
                                                                    <h4 className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</h4>
                                                                </div>
                                                                <div className="flex flex-col items-end pr-2 text-right shrink-0">
                                                                    {hideB2bPrice ? (
                                                                        <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.basePrice || p.priceResolved)}</span>
                                                                    ) : (
                                                                        <>
                                                                            <span className="text-[11px] font-medium text-slate-400">L. Fiyatı: {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.basePrice || p.priceResolved)}</span>
                                                                            <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-4">
                                                                    <button onClick={() => router.push('/network/catalog/' + p.id)} className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-200" title="Detaya Git"><Search className="w-[18px] h-[18px]" strokeWidth={2} /></button>
                                                                    <button disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)} onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))} className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors border ${addingToCart === p.id ? 'bg-emerald-600 text-white border-emerald-600' : p.stock < (p.minOrderQty || 1) ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}>
                                                                        {addingToCart === p.id ? <Check className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2} />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Right List */}
                                                    <div className="flex flex-col gap-3">
                                                        {rightList.map(p => (
                                                            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 transition-colors shadow-sm relative overflow-hidden group">
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                                                                {p.campaign && (
                                                                    <div className="absolute top-0 right-0 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border-b border-l border-emerald-200 px-2 py-0.5 rounded-bl-xl flex items-center shadow-sm uppercase tracking-wide z-10">
                                                                        {p.campaign.buyQuantity + p.campaign.rewardQuantity} AL {p.campaign.buyQuantity} ÖDE
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0 pl-1">
                                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">{p.sku || "N/A"}</span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded truncate max-w-[100px]">{p.category || "Diğer"}</span>
                                                                        <div className={`ml-auto w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                    </div>
                                                                    <h4 className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</h4>
                                                                </div>
                                                                <div className="flex flex-col items-end pr-2 text-right shrink-0">
                                                                    {hideB2bPrice ? (
                                                                        <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.basePrice || p.priceResolved)}</span>
                                                                    ) : (
                                                                        <>
                                                                            <span className="text-[11px] font-medium text-slate-400">L. Fiyatı: {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.basePrice || p.priceResolved)}</span>
                                                                            <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-4">
                                                                    <button onClick={() => router.push('/network/catalog/' + p.id)} className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-200" title="Detaya Git"><Search className="w-[18px] h-[18px]" strokeWidth={2} /></button>
                                                                    <button disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)} onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))} className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors border ${addingToCart === p.id ? 'bg-emerald-600 text-white border-emerald-600' : p.stock < (p.minOrderQty || 1) ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}>
                                                                        {addingToCart === p.id ? <Check className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2} />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
</>
                            </div>
                            
                            {/* Pagination Buttons */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex items-center justify-center gap-2">
                                    <button 
                                        className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold disabled:opacity-50 text-slate-600"
                                        disabled={page <= 1} onClick={() => setPage(page - 1)}
                                    >
                                        Önceki
                                    </button>
                                    <div className="text-sm font-semibold text-slate-600 px-4">
                                        Sayfa {page} / {totalPages}
                                    </div>
                                    <button 
                                        className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold disabled:opacity-50 text-slate-600"
                                        disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                    >
                                        Sonraki
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            
        </div>
    )
}

function ProductCard({ p, router, addingToCart, addToCart, hideB2bPrice, fmt }: any) {
    return (
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col relative h-[435px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-transparent group-hover:from-blue-500/20 group-hover:via-blue-500/20 transition-colors duration-500" />
            <div className="h-48 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center p-6 relative">
                {p.campaign && (
                    <div className="absolute top-3 right-3 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md flex items-center shadow-sm uppercase tracking-wider z-10 backdrop-blur-sm">
                        {p.campaign.buyQuantity + p.campaign.rewardQuantity} AL {p.campaign.buyQuantity} ÖDE
                    </div>
                )}
                <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-300">
                    <img src={p.image} alt={p.name} className="w-full h-full object-contain filter drop-shadow-sm mix-blend-multiply" />
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-slate-100 px-2 py-0.5 rounded-md">{p.sku || "N/A"}</span>
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-slate-100 px-2 py-0.5 rounded-md">{p.category || "Diğer"}</span>
                    {(p.minOrderQty > 1) && (
                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">MOQ: {p.minOrderQty}</span>
                    )}
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                <div className="mt-auto">
                    {p.pointsRate > 0 && (
                        <div className="mb-3 flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                            <span className="text-[10px] font-black uppercase tracking-tight">+{Math.floor(p.priceResolved * p.pointsRate)} Puan</span>
                        </div>
                    )}
                    <div className="flex items-end justify-between pt-3 border-t border-slate-100/50">
                        <div>
                            {hideB2bPrice ? (
                                <>
                                    <div className="text-[12px] font-medium text-slate-500 mb-0.5">Satış Fiyatı</div>
                                    <div className="text-lg font-bold text-slate-900 tracking-tight">{fmt(p.basePrice || p.priceResolved)}</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-[11px] font-medium text-slate-400 mb-0.5" title="Liste Fiyatı">L. Fiyatı: {fmt(p.basePrice || p.priceResolved)}</div>
                                    <div className="text-lg font-bold text-slate-900 tracking-tight">{fmt(p.priceResolved)}</div>
                                </>
                            )}
                            <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} /> Stok: {p.stock > 0 ? <span className="font-medium text-slate-700">{p.stock}</span> : "0"}</div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => router.push('/network/catalog/' + p.id)} className="h-9 px-2 rounded-lg text-slate-500 hover:bg-slate-50 border border-slate-100 transition-all active:scale-95" title="Detay"><Search className="w-4 h-4" /></button>
                            <button disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)} onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))} className={`h-9 px-3 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${addingToCart === p.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}>
                                {addingToCart === p.id ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
