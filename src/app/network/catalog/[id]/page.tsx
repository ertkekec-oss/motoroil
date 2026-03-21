"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useModal } from "@/contexts/ModalContext"
import { PackageOpen, ShoppingBag, Heart, Share2, HelpCircle, MessageCircle, ChevronLeft, Loader2, Star } from "lucide-react"

export default function CatalogProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { showError, showSuccess } = useModal()
    
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [addingToCart, setAddingToCart] = useState(false)

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
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1a1a1a] leading-[1.15] tracking-tight mb-4">
                        {product.name}
                    </h1>

                    {/* Ratings Mock */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex gap-1 text-slate-300">
                            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                        </div>
                        <span className="text-sm font-bold text-slate-400 tracking-wide uppercase">(0) View All Reviews</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-4xl font-black text-[#1a1a1a] tracking-tight">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.priceResolved).replace('$', '₺')}
                        </span>
                        {/* Mock old price & discount badge for Pawzy style */}
                        <span className="text-2xl font-bold text-slate-300 line-through">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.priceResolved * 1.1).replace('$', '₺')}
                        </span>
                        <span className="px-2.5 py-1 bg-red-600 text-white text-[13px] font-black rounded-md tracking-wider">
                            -10%
                        </span>
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-slate-500 text-[15px] leading-relaxed mb-10 whitespace-pre-wrap font-medium">
                        {product.description || "Bu ürün için detaylı açıklama bulunmuyor. Özellikleri ve ticari avantajları hakkında satıcı bayiniz ile iletişime geçebilirsiniz."}
                    </p>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-[120px_1fr] gap-y-4 text-[13px] mb-10 border-t border-slate-100 pt-8">
                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">AVAILABLE:</div>
                        <div className={`font-bold uppercase tracking-wider ${stock > 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {stock > 0 ? `IN STOCK (${stock})` : "OUT OF STOCK"}
                        </div>

                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">TAGS:</div>
                        <div className="font-medium text-slate-500">{product.category}, B2B</div>

                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">SKU:</div>
                        <div className="font-medium text-slate-500 uppercase">{product.sku || "N/A"}</div>
                        
                        <div className="font-extrabold text-[#1a1a1a] tracking-wide">CATEGORY:</div>
                        <div className="font-medium text-slate-500">{product.category}</div>
                    </div>

                    {/* Add to Cart Area */}
                    <div className="mb-4">
                        <div className="font-extrabold text-[#1a1a1a] text-[13px] tracking-wide mb-4">QUANTITY:</div>
                        
                        <div className="flex items-center gap-4 h-14">
                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between px-2 w-[140px] h-full rounded-[14px] border border-slate-200 bg-white">
                                <button 
                                    onClick={() => setQuantity(Math.max(product.minOrderQty || 1, quantity - 1))}
                                    className="w-10 h-10 flex flex-col items-center justify-center text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-50 rounded-lg text-lg transition-colors font-medium"
                                >
                                    -
                                </button>
                                <span className="text-[17px] font-black text-[#1a1a1a] w-10 text-center select-none block leading-[40px] pt-1">
                                    {quantity}
                                </span>
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
                                {addingToCart ? "Yükleniyor..." : "Add To Bag"}
                            </button>

                            {/* Favorite Button */}
                            <button className="w-14 h-14 shrink-0 rounded-[14px] bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#1a1a1a] transition-all">
                                <Heart className="w-6 h-6" strokeWidth={1.5} />
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
                        Buy Now (Hemen Al)
                    </button>

                    {/* Links row */}
                    <div className="flex items-center gap-8 mt-10 pt-8 border-t border-slate-100 text-[13px] font-black text-[#1a1a1a] tracking-wider uppercase">
                        <button className="flex items-center gap-2.5 hover:text-blue-600 transition-colors">
                            <Share2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            Share
                        </button>
                        <button className="flex items-center gap-2.5 hover:text-blue-600 transition-colors">
                            <HelpCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            Ask a Question
                        </button>
                        <button className="flex items-center gap-2.5 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            FAQ
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
