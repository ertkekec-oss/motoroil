"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useModal } from "@/contexts/ModalContext"
import { PackageOpen, Search, Filter, ShoppingCart, Info, Loader2, Plus, Check } from "lucide-react"

export default function NetworkCatalogPage() {
    const { showError, showSuccess } = useModal()
    const router = useRouter()
    const [q, setQ] = useState("")
    const [activeCat, setActiveCat] = useState<string>("")
    const [categories, setCategories] = useState<string[]>([])
    const [banners, setBanners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [addingToCart, setAddingToCart] = useState<string | null>(null)

    // Load categories once
    useEffect(() => {
        fetch("/api/network/catalog/categories")
            .then(res => res.json())
            .then(data => {
                if (data.ok) setCategories(data.categories || [])
            })
            .catch(() => {})

        fetch("/api/network/catalog/banners")
            .then(res => res.json())
            .then(data => {
                if (data.ok) setBanners(data.banners || [])
            })
            .catch(() => {})
    }, [])

    // Helper: Debounce search
    useEffect(() => {
        const timer = setTimeout(() => fetchCatalog(), 400)
        return () => clearTimeout(timer)
    }, [q, activeCat, page])

    const imageProducts = products.filter((p: any) => !!p.image).slice(0, 8);
    const noImageProducts = products.filter((p: any) => !p.image);
    const leftList = noImageProducts.slice(0, Math.ceil(noImageProducts.length / 2));
    const rightList = noImageProducts.slice(Math.ceil(noImageProducts.length / 2));

    useEffect(() => { setPage(1) }, [q, activeCat])

    const fetchCatalog = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/network/catalog?q=${encodeURIComponent(q)}&category=${encodeURIComponent(activeCat)}&page=${page}&take=16`)
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
                showSuccess("Sepet", `${qty} adet ${p.name} sepete eklendi.`)
            } else {
                showError("Sepet", data.error || "Ürün sepete eklenemedi.")
            }
        } catch (e: any) {
            showError("Hata", "Ağ hatası: " + e.message)
        } finally {
            setTimeout(() => setAddingToCart(null), 1000) // Keep success state briefly
        }
    }

    return (
        <div className="font-sans min-h-[calc(100vh-64px)] bg-slate-50">
            <div className="mx-auto w-full max-w-7xl px-6 py-10 space-y-8">
                
                {/* 1. BANNERS ROW */}
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    {/* Alan 1 (Main Banner) */}
                    <div className="w-full relative overflow-hidden rounded-2xl flex items-center bg-transparent group cursor-pointer shadow-sm" style={{ flex: '1200 1 0%', aspectRatio: '1200/420' }}>
                        {banners.filter(b => b.placement === 'main' || !b.placement).length > 0 ? (
                            <>
                                <img src={banners.filter(b => b.placement === 'main' || !b.placement)[0].imageUrl} alt="Main Banner" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" onClick={() => { const link = banners.filter(b => b.placement === 'main' || !b.placement)[0].linkUrl; if(link) window.open(link, '_blank') }} />
                                {banners.filter(b => b.placement === 'main' || !b.placement).length > 1 && (
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-bold">1 / {banners.filter(b => b.placement === 'main' || !b.placement).length}</div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center">
                                <span className="text-slate-400 font-medium text-sm hidden md:inline-block">Katalog Yükleniyor...</span>
                            </div>
                        )}
                    </div>

                    {/* Alan 2 (Side Banner) */}
                    {banners.filter(b => b.placement === 'side').length > 0 && (
                        <div className="w-full shrink-0 relative overflow-hidden rounded-2xl flex items-center bg-transparent group cursor-pointer shadow-sm hidden md:flex" style={{ flex: '380 1 0%', aspectRatio: '380/420' }}>
                            <img src={banners.filter(b => b.placement === 'side')[0].imageUrl} alt="Side Banner" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" onClick={() => { const link = banners.filter(b => b.placement === 'side')[0].linkUrl; if(link) window.open(link, '_blank') }} />
                        </div>
                    )}
                </div>

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

                    <div className="w-full md:w-[350px] shrink-0 relative group">
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

                {/* 1.5. CATEGORY FILTERS (Scrollable) */}
                {categories.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 custom-scroll scroll-smooth -mt-2" style={{ scrollbarWidth: "none" }}>
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
                        {categories.map((cat) => (
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
                                                    {imageProducts.map(p => (
                                                        <div key={p.id} className="group bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col relative">
                                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-transparent group-hover:from-blue-500/20 group-hover:via-blue-500/20 transition-colors duration-500" />
                                                            <div className="h-48 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center p-6 relative">
                                                                <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-300">
                                                                    <img src={p.image} alt={p.name} className="w-full h-full object-contain filter drop-shadow-sm mix-blend-multiply" />
                                                                </div>
                                                            </div>
                                                            <div className="p-5 flex flex-col flex-1">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-slate-100 px-2 py-0.5 rounded-md">{p.sku || "N/A"}</span>
                                                                    {(p.minOrderQty > 1) && (
                                                                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">MOQ: {p.minOrderQty}</span>
                                                                    )}
                                                                </div>
                                                                <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                                                <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100/50">
                                                                    <div>
                                                                        <div className="text-[12px] font-medium text-slate-500 mb-0.5">Size Özel</div>
                                                                        <div className="text-lg font-bold text-slate-900 tracking-tight">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</div>
                                                                        <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} /> Stok: {p.stock > 0 ? <span className="font-medium text-slate-700">{p.stock} adet</span> : "Tükendi"}</div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button onClick={() => router.push('/network/catalog/' + p.id)} className="h-10 px-3 rounded-xl text-[13px] font-semibold flex items-center justify-center bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm" title="İncele"><Info className="w-4 h-4" strokeWidth={2} /></button>
                                                                        <button disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)} onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))} className={`h-10 px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center min-w-[80px] gap-2 transition-all active:scale-95 border ${addingToCart === p.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : p.stock < (p.minOrderQty || 1) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm'}`}>
                                                                            {addingToCart === p.id ? <><Check className="w-4 h-4" strokeWidth={2.5} /> Eklendi</> : <><Plus className="w-4 h-4" strokeWidth={2.5} /> Ekle</>}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {noImageProducts.length > 0 && (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                                                    {/* Left List */}
                                                    <div className="flex flex-col gap-3">
                                                        {leftList.map(p => (
                                                            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 transition-colors shadow-sm relative overflow-hidden group">
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                                                                <div className="flex-1 min-w-0 pl-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">{p.sku || "N/A"}</span>
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                    </div>
                                                                    <h4 className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</h4>
                                                                </div>
                                                                <div className="flex flex-col items-end pr-2 text-right shrink-0">
                                                                    <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-4">
                                                                    <button onClick={() => router.push('/network/catalog/' + p.id)} className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-200"><Info className="w-[18px] h-[18px]" strokeWidth={2} /></button>
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
                                                                <div className="flex-1 min-w-0 pl-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">{p.sku || "N/A"}</span>
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                    </div>
                                                                    <h4 className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</h4>
                                                                </div>
                                                                <div className="flex flex-col items-end pr-2 text-right shrink-0">
                                                                    <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-4">
                                                                    <button onClick={() => router.push('/network/catalog/' + p.id)} className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-200"><Info className="w-[18px] h-[18px]" strokeWidth={2} /></button>
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

                {/* Footer Text */}
                <div className="mt-14 text-center pb-8 border-t border-slate-200/50 pt-8">
                    <p className="text-sm font-medium text-slate-500">
                        Periodya B2B — Kurumsal ticaret altyapısı ile işinizi büyütün.
                    </p>
                </div>

            </div>
            
            
        </div>
    )
}
