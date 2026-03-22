"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useModal } from "@/contexts/ModalContext"
import { PackageOpen, ChevronLeft, Loader2, Coins, ShoppingCart, Plus, Minus, Search, Eye, EyeOff } from "lucide-react"

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
                const res = await fetch(`/api/network/catalog/${params.id}`, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } })
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
            const res = await fetch("/api/network/cart/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product.id,
                    catalogItemId: product.catalogItemId,
                    quantity: quantity
                })
            })
            const data = await res.json()
            if (data.ok || !data.error) {
                window.dispatchEvent(new Event('cart_update'));
                showSuccess("Başarılı", `${quantity} adet sepete eklendi.`)
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
            <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <span className="text-sm font-bold tracking-widest uppercase">Yükleniyor...</span>
                </div>
            </div>
        )
    }

    if (!product) return null

    const stock = product.stock || 0
    const outOfStock = stock === 0
    const earnPoints = product.pointsRate > 0 ? Math.floor(product.priceResolved * quantity * product.pointsRate) : 0;
    const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

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

            <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col lg:flex-row items-start gap-12">
                
                {/* Left side: Image */}
                <div className="w-full lg:w-[40%] shrink-0 flex items-center justify-center rounded-3xl bg-slate-50 border border-slate-100 p-8 min-h-[450px] relative">
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
                <div className="w-full lg:w-[60%] flex flex-col pt-2">
                    
                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1a1a1a] leading-[1.15] tracking-tight mb-8">
                        {product.name}
                    </h1>

                    {/* Price & Labels */}
                    <div className="flex flex-wrap items-end gap-6 mb-8">
                        {hideB2bPrice ? (
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-400 tracking-wider uppercase mb-1">Satış Fiyatı</span>
                                <span className="text-4xl font-black text-[#1a1a1a] tracking-tight">
                                    {fmt(product.basePrice || product.priceResolved)}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-slate-400 tracking-wider uppercase mb-1">Liste Fiyatı</span>
                                    <span className="text-2xl font-bold text-slate-400 line-through">
                                        {fmt(product.basePrice || product.priceResolved)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-slate-500 tracking-wider uppercase mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Size Özel</span>
                                    <span className="text-4xl font-black text-[#1a1a1a] tracking-tight">
                                        {fmt(product.priceResolved)}
                                    </span>
                                </div>
                                
                                {/* PARAPUAN & KAMPANYA BOXES SIDE-BY-SIDE */}
                                <div className="flex items-center gap-3 pb-1">
                                    {earnPoints > 0 && (
                                        <div className="bg-amber-50 text-amber-600 text-[10px] font-black px-4 py-3 rounded-xl border border-amber-100 flex items-center gap-2 shadow-sm whitespace-nowrap">
                                            <Coins size={16} strokeWidth={3} />
                                            <div className="flex flex-col">
                                                <span className="opacity-70 text-[8px] uppercase leading-none mb-1">PARAPUAN</span>
                                                <span className="leading-none">+{earnPoints.toLocaleString('tr-TR')} PUAN</span>
                                            </div>
                                        </div>
                                    )}
                                    {product.campaign && (
                                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm whitespace-nowrap">
                                            <ShoppingCart size={16} strokeWidth={3} />
                                            <div className="flex flex-col">
                                                <span className="opacity-70 text-[8px] uppercase leading-none mb-1">KAMPANYA</span>
                                                <span className="leading-none">{product.campaign.name || "AKTİF"}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Description Paragraph */}
                    <div className="mb-10">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Açıklama</span>
                        <p className="text-slate-500 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                            {product.description || "Bu ürün için detaylı açıklama bulunmuyor. Özellikleri ve ticari avantajları hakkında satıcı bayiniz ile iletişime geçebilirsiniz."}
                        </p>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-[120px_1fr] gap-y-4 text-[13px] mb-10 border-t border-slate-100 pt-8">
                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">STOK DURUMU:</div>
                        <div className={`font-bold uppercase tracking-wider ${stock > 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {stock > 0 ? `Stok: ${stock} adet` : "Stokta Yok"}
                        </div>

                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">SKU / KOD:</div>
                        <div className="font-medium text-slate-500 uppercase">{product.sku || "—"}</div>
                        
                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">KATEGORİ:</div>
                        <div className="font-medium text-slate-500">{product.category || "Diğer"}</div>
                    </div>

                    {/* Add to Cart Area */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 h-14">
                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between px-2 w-[140px] h-full rounded-[14px] border border-slate-200 bg-white shadow-sm grow-0">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 flex flex-col items-center justify-center text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-50 rounded-lg text-lg transition-colors font-medium"
                                >
                                    -
                                </button>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={localQtyStr !== null ? localQtyStr : quantity.toString()}
                                    onChange={(e) => setLocalQtyStr(e.target.value)}
                                    onBlur={(e) => {
                                        let n = parseInt(e.target.value, 10);
                                        if (isNaN(n) || n < 1) n = 1;
                                        setQuantity(n);
                                        setLocalQtyStr(null);
                                    }}
                                    className="text-[17px] font-black text-[#1a1a1a] w-12 text-center bg-transparent border-none outline-none focus:ring-0 p-0 mx-auto"
                                />
                                <button 
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-50 rounded-lg text-lg transition-colors font-medium"
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                disabled={outOfStock || addingToCart}
                                onClick={handleAddToCart}
                                className={`flex-1 h-full rounded-[14px] text-[15px] font-extrabold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                                    outOfStock 
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-500/10"
                                }`}
                            >
                                {addingToCart ? <Loader2 className="animate-spin w-5 h-5" /> : "SEPETE EKLE"}
                            </button>
                        </div>

                        {/* Buy It Now Button */}
                        <button
                            disabled={outOfStock || addingToCart}
                            className={`w-full h-14 rounded-[14px] border-2 text-[15px] font-black uppercase tracking-wide transition-all ${
                                outOfStock 
                                ? "border-slate-200 text-slate-300"
                                : "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white shadow-sm"
                            }`}
                        >
                            HEMEN AL
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
