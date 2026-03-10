"use client"

import React, { useState, useEffect } from "react"
import { useModal } from "@/contexts/ModalContext"
import { PackageOpen, Search, Filter, ShoppingCart, Info, Loader2, Plus, Check } from "lucide-react"

export default function NetworkCatalogPage() {
    const { showError, showSuccess } = useModal()
    const [q, setQ] = useState("")
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<any[]>([])
    const [addingToCart, setAddingToCart] = useState<string | null>(null)

    // Helper: Debounce search
    useEffect(() => {
        const timer = setTimeout(() => fetchCatalog(), 400)
        return () => clearTimeout(timer)
    }, [q])

    const fetchCatalog = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/network/catalog?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            if (res.ok && data.ok) {
                setProducts(data.products || [])
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
            const res = await fetch("/api/network/cart", {
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
                
                {/* 1. HEADER & SEARCH BAR */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center px-2.5 py-1 mb-3 rounded-md bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                            Katalog Altyapısı
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Ürün Kataloğu</h1>
                        <p className="mt-2 text-[15px] text-slate-500 max-w-xl leading-relaxed">
                            Ağa özel tanımlanmış ürünleri, tahsis edilen limitinizi kullanarak size özel fiyatlarla sipariş edebilirsiniz.
                        </p>
                    </div>

                    <div className="w-full md:w-[400px] shrink-0 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={1.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Stok kodu (SKU) veya ürün adı girin..."
                            className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        {/* Optional Filter Button inside input */}
                        <div className="absolute inset-y-0 right-1.5 flex items-center">
                            <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                <Filter className="h-4 w-4" strokeWidth={2} />
                            </button>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((p) => (
                                <div key={p.id} className="group bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col relative">
                                    
                                    {/* Abstract Highlight Line */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-transparent group-hover:from-blue-500/20 group-hover:via-blue-500/20 transition-colors duration-500" />

                                    {/* Image Area */}
                                    <div className="h-48 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center p-6 relative">
                                        {/* Mockup product icon */}
                                        <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 group-hover:scale-105 group-hover:text-blue-500/50 transition-all duration-300">
                                            <PackageOpen className="w-10 h-10" strokeWidth={1} />
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                                                {p.sku || "N/A"}
                                            </span>
                                            {(p.minOrderQty > 1) && (
                                              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                  MOQ: {p.minOrderQty}
                                              </span>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
                                            {p.name}
                                        </h3>

                                        <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100/50">
                                            <div>
                                                <div className="text-[12px] font-medium text-slate-500 mb-0.5">Size Özel</div>
                                                <div className="text-lg font-bold text-slate-900 tracking-tight">
                                                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}
                                                </div>
                                                <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    Stok: {p.stock > 0 ? <span className="font-medium text-slate-700">{p.stock} adet</span> : "Tükendi"}
                                                </div>
                                            </div>

                                            <button
                                                disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)}
                                                onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))}
                                                className={`h-10 px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center min-w-[80px] gap-2 transition-all active:scale-95 border
                                                    ${addingToCart === p.id 
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                                    : p.stock < (p.minOrderQty || 1)
                                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                                                    }`}
                                            >
                                                {addingToCart === p.id ? (
                                                    <>
                                                        <Check className="w-4 h-4" strokeWidth={2.5} />
                                                        Eklendi
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                                                        Ekle
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
