"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useModal } from "@/contexts/ModalContext"
import { PackageOpen, ChevronLeft, Loader2 } from "lucide-react"

export default function CatalogProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { showError, showSuccess } = useModal()
    
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [localQtyStr, setLocalQtyStr] = useState<string | null>(null)
    const [addingToCart, setAddingToCart] = useState(false)
    const [hideB2bPrice, setHideB2bPrice] = useState(false)

    useEffect(() => {
        setHideB2bPrice(localStorage.getItem('hideB2bPrice') === 'true')
    }, [])

    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`/api/network/catalog/${params.id}`)
                const data = await res.json()
                if (data.ok) {
                    setProduct(data.product)
                    setQuantity(Math.max(1, data.product.minOrderQty || 1))
                } else {
                    showError("Hata", data.error || "Ürün yüklenemedi")
                    router.push('/network/catalog')
                }
            } catch (err: any) {
                showError("Hata", "Bağlantı hatası oluştu.")
                router.push('/network/catalog')
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchProduct()
    }, [params.id, router, showError])

    const handleAddToCart = async () => {
        if (!product || addingToCart) return
        
        setAddingToCart(true)
        try {
            const res = await fetch("/api/network/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    catalogItemId: product.catalogItemId,
                    quantity: quantity
                })
            })
            const data = await res.json()
            if (data.ok) {
                showSuccess("Başarılı", `${quantity} adet sepete eklendi.`)
                // Wait briefly for UI feel
                setTimeout(() => setAddingToCart(false), 500)
            } else {
                showError("Hata", data.error || "Sepete eklenemedi")
                setAddingToCart(false)
            }
        } catch (err: any) {
            showError("Hata", "Bağlantı hatası")
            setAddingToCart(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-sm font-medium tracking-widest uppercase">Yükleniyor...</span>
                </div>
            </div>
        )
    }

    if (!product) return null

    const stock = product.stock || 0
    const outOfStock = stock === 0 || stock < quantity

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans pb-24">
            
            {/* Top Navigation Bar / Breadcrumb */}
            <div className="max-w-[1400px] mx-auto px-6 py-6 border-b border-slate-100 flex items-center justify-between">
                <button 
                    onClick={() => router.push('/network/catalog')}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Kataloğa Dön
                </button>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8 flex items-start gap-12">
                
                {/* Left side: Image */}
                <div className="w-[40%] shrink-0 flex items-center justify-center rounded-3xl bg-slate-50 border border-slate-100 p-8 min-h-[450px] relative">
                    {product.image ? (
                        <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-contain max-h-[500px] filter drop-shadow-xl select-none"
                            draggable={false}
                        />
                    ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-4">
                            <PackageOpen className="w-24 h-24" strokeWidth={1} />
                            <span className="text-base font-medium tracking-wide">Ürün Görseli Yok</span>
                        </div>
                    )}
                </div>

                {/* Right side: Product Content */}
                <div className="w-[60%] flex flex-col pt-2">
                    
                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1a1a1a] leading-[1.15] tracking-tight mb-8">
                        {product.name}
                    </h1>

                    {/* Price */}
                    <div className="flex items-end gap-6 mb-8">
                        {hideB2bPrice ? (
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-400 tracking-wider uppercase mb-1">Satış Fiyatı</span>
                                <span className="text-4xl font-black text-[#1a1a1a] tracking-tight">
                                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.basePrice || product.priceResolved)}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-slate-400 tracking-wider uppercase mb-1">Liste Fiyatı</span>
                                    <span className="text-2xl font-bold text-slate-400">
                                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.basePrice || product.priceResolved)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-slate-500 tracking-wider uppercase mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Size Özel</span>
                                    <span className="text-4xl font-black text-[#1a1a1a] tracking-tight">
                                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.priceResolved)}
                                    </span>
                                </div>
                                {product.campaign && (
                                    <div className="flex flex-col justify-end pb-1.5 pl-4">
                                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl px-4 py-2 flex items-center gap-3">
                                            <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest leading-none mb-1">Kampanya</span>
                                                <span className="block text-sm font-bold text-emerald-950 leading-none">
                                                    {product.campaign.buyQuantity} Al {product.campaign.rewardQuantity} Öde
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-slate-500 text-[15px] leading-relaxed mb-10 whitespace-pre-wrap font-medium">
                        {product.description || "Bu ürün için detaylı açıklama bulunmuyor. Özellikleri ve ticari avantajları hakkında satıcı bayiniz ile iletişime geçebilirsiniz."}
                    </p>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-[120px_1fr] gap-y-4 text-[13px] mb-10 border-t border-slate-100 pt-8">
                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">STOK DURUMU:</div>
                        <div className={`font-bold uppercase tracking-wider ${stock > 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {stock > 0 ? `Stok: ${stock} adet` : "Stokta Yok"}
                        </div>

                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">SKU:</div>
                        <div className="font-medium text-slate-500 uppercase">{product.sku || "N/A"}</div>
                        
                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">KATEGORİ:</div>
                        <div className="font-medium text-slate-500">{product.category}</div>
                    </div>

                    {/* Add to Cart Area */}
                    <div className="mb-4">
                        <div className="font-extrabold text-[#1a1a1a] text-[13px] tracking-wide mb-4">MİKTAR:</div>
                        
                        <div className="flex items-center gap-4 h-14">
                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between px-2 w-[140px] h-full rounded-[14px] border border-slate-200 bg-white">
                                <button 
                                    onClick={() => setQuantity(Math.max(product.minOrderQty || 1, quantity - 1))}
                                    className="w-10 h-10 flex flex-col items-center justify-center text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-50 rounded-lg text-lg transition-colors font-medium"
                                >
                                    -
                                </button>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={localQtyStr !== null ? localQtyStr : quantity.toString()}
                                    onChange={(e) => setLocalQtyStr(e.target.value)}
                                    onBlur={(e) => {
                                        let n = parseInt(e.target.value, 10);
                                        const min = product.minOrderQty || 1;
                                        const max = product.maxOrderQty || 9999;
                                        if (isNaN(n) || n < min) n = min;
                                        if (n > max) n = max;
                                        setQuantity(n);
                                        setLocalQtyStr(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                    className="text-[17px] font-black text-[#1a1a1a] w-12 text-center bg-transparent border-none outline-none focus:ring-0 p-0 mx-auto leading-[40px]"
                                />
                                <button 
                                    onClick={() => setQuantity(Math.min(product.maxOrderQty || 9999, quantity + 1))}
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-50 rounded-lg text-lg transition-colors font-medium"
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Bag Button */}
                            <button
                                disabled={outOfStock || addingToCart}
                                onClick={handleAddToCart}
                                className={`flex-1 h-full rounded-[14px] text-[15px] font-extrabold uppercase tracking-wide transition-all ${
                                    outOfStock 
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                    : "bg-slate-100 hover:bg-slate-200 text-[#1a1a1a] active:scale-[0.98]"
                                }`}
                            >
                                {addingToCart ? "Yükleniyor..." : "SEPETE EKLE"}
                            </button>
                        </div>
                    </div>

                    {/* Buy It Now Button */}
                    <button
                        disabled={outOfStock || addingToCart}
                        className={`w-full h-14 rounded-[14px] border-2 text-[15px] font-black uppercase tracking-wide transition-all ${
                            outOfStock 
                            ? "border-slate-200 text-slate-300"
                            : "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                        }`}
                    >
                        HEMEN AL
                    </button>

                </div>
            </div>
        </div>
    )
}
