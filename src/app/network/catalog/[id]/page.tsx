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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
            
            {/* Top Navigation Bar / Breadcrumb */}
            <div className="max-w-7xl mx-auto px-6 py-6 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
                <button 
                    onClick={() => router.push('/network/catalog')}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Kataloğa Dön
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-start gap-12">
                
                {/* Left side: Image */}
                <div className="w-full lg:w-[45%] shrink-0 flex items-center justify-center rounded-[32px] bg-white border border-slate-200 p-12 min-h-[500px] relative shadow-lg group overflow-hidden">
                    {product.image ? (
                        <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-contain max-h-[450px] filter drop-shadow-2xl select-none group-hover:scale-105 transition-transform duration-700"
                            draggable={false}
                        />
                    ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-4">
                            <PackageOpen className="w-24 h-24" strokeWidth={1} />
                            <span className="text-base font-bold tracking-wide">Ürün Görseli Yok</span>
                        </div>
                    )}
                    
                    {product.campaign && (
                        <div className="absolute top-6 right-6 bg-emerald-100/90 text-emerald-600 text-[11px] font-black px-4 py-2 rounded-xl border border-emerald-200 shadow-sm uppercase z-10 backdrop-blur-sm">
                            {product.campaign.name || `${product.campaign.buyQuantity + product.campaign.rewardQuantity} AL ${product.campaign.buyQuantity} ÖDE`}
                        </div>
                    )}
                </div>

                {/* Right side: Product Content */}
                <div className="w-full lg:w-[55%] flex flex-col pt-2 space-y-8">
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-400 uppercase tracking-tighter">{product.sku}</span>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-400 uppercase tracking-tighter">{product.category || "Diğer"}</span>
                        </div>
                        <h1 className="text-4xl sm:text-[44px] font-black text-slate-900 leading-[1.1] tracking-tight">
                            {product.name}
                        </h1>
                    </div>

                    {/* Price Area */}
                    <div className="flex flex-wrap items-end gap-10 bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
                        <div className="flex flex-col">
                            {!hideB2bPrice && (
                                <div className="space-y-1 mb-2">
                                    <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase mb-1 block">Liste Fiyatı</span>
                                    <span className="text-2xl font-bold text-slate-300 line-through">
                                        {fmt(product.basePrice || product.priceResolved)}
                                    </span>
                                </div>
                            )}
                            <div className="space-y-1">
                                <span className="text-[11px] font-black text-blue-600 tracking-wider uppercase mb-1 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 
                                    Size Özel
                                </span>
                                <span className="text-[48px] font-black text-slate-900 leading-none tracking-tighter">
                                    {fmt(product.priceResolved)}
                                </span>
                            </div>
                        </div>

                        {/* PARAPUAN & KAMPANYA BOXES (SIDE BY SIDE IN DETAIL) */}
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            {earnPoints > 0 && (
                                <div className="bg-amber-50 text-amber-600 text-[11px] font-black px-5 py-3 rounded-2xl border border-amber-100 flex items-center gap-3 shadow-sm">
                                    <Coins size={18} strokeWidth={3} />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-widest opacity-70">Parapuan</span>
                                        <span>+{earnPoints.toLocaleString('tr-TR')} PUAN</span>
                                    </div>
                                </div>
                            )}
                            {product.campaign && (
                                <div className="bg-emerald-50 text-emerald-600 text-[11px] font-black px-5 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm">
                                    <ShoppingCart size={18} strokeWidth={3} />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-widest opacity-70">Kampanya</span>
                                        <span>{product.campaign.name || "KAMPANYA AKTİF"}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description Paragraph */}
                    <div className="space-y-3">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Açıklama</span>
                        <p className="text-slate-500 text-[16px] leading-relaxed whitespace-pre-wrap font-medium">
                            {product.description || "Bu ürün için detaylı açıklama bulunmuyor. Özellikleri ve ticari avantajları hakkında satıcı bayiniz ile iletişime geçebilirsiniz."}
                        </p>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-100/50 p-6 rounded-2xl">
                        <div className="space-y-1">
                            <div className="font-black text-slate-400 text-[10px] tracking-widest uppercase">STOK DURUMU</div>
                            <div className={`font-black text-[15px] uppercase flex items-center gap-2 ${stock > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                <div className={`w-2 h-2 rounded-full ${stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {stock > 0 ? `STOK: ${stock} ADET` : "STOKTA YOK"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="font-black text-slate-400 text-[10px] tracking-widest uppercase">SKU / KOD</div>
                            <div className="font-black text-slate-800 text-[15px] uppercase">{product.sku || "—"}</div>
                        </div>
                    </div>

                    {/* Add to Cart Area */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center justify-between p-1.5 w-full sm:w-[160px] h-[64px] rounded-2xl bg-white border border-slate-200 shadow-sm grow-0">
                            <button 
                                onClick={() => setQuantity(Math.max(product.minOrderQty || 1, quantity - 1))}
                                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                                <Minus size={20} />
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
                                className="text-xl font-black text-slate-900 w-12 text-center bg-transparent border-none focus:ring-0 p-0"
                            />
                            <button 
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <button
                            disabled={outOfStock || addingToCart}
                            onClick={handleAddToCart}
                            className={`flex-1 h-[64px] rounded-2xl text-[16px] font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-3 ${
                                outOfStock 
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-blue-500/20"
                            }`}
                        >
                            {addingToCart ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={20} strokeWidth={3} /> SEPETE EKLE</>}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
