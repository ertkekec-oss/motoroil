"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useModal } from "@/contexts/ModalContext"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { PackageOpen, ChevronLeft, Loader2, Coins, ShoppingCart, Plus, Minus } from "lucide-react"

export default function CatalogProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const getPath = useNetworkPath()
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
                    router.push(getPath('/network/catalog'))
                }
            } catch (err: any) {
                showError("Hata", "Bağlantı hatası oluştu.")
                router.push(getPath('/network/catalog'))
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchProduct()
    }, [params.id, router, showError, getPath])

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
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!product) return null

    const stock = product.stock || 0
    const pointsRate = product.pointsRate || product.pointsCampaign?.discountRate || 0;
    const earnPoints = pointsRate > 0 ? Math.floor((product.priceResolved || 0) * quantity * pointsRate) : 0;
    const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

    return (
        <div className="min-h-screen bg-white font-sans pb-24 text-slate-900">
            {/* Top Bar */}
            <div className="max-w-[1400px] mx-auto px-6 py-6 border-b border-slate-100">
                <button onClick={() => router.push(getPath('/network/catalog'))} className="flex items-center gap-2 text-[13px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                    <ChevronLeft size={16} strokeWidth={3} /> Kataloğa Dön
                </button>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-12 flex items-start gap-16">
                
                {/* SOL BÖLÜM: ÜRÜN GÖRSELİ */}
                <div className="w-[40%] shrink-0 flex items-center justify-center rounded-[32px] bg-slate-50 border border-slate-100 p-12 min-h-[550px] relative overflow-hidden">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain filter drop-shadow-2xl select-none" draggable={false} />
                    ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-4">
                            <PackageOpen className="w-24 h-24" strokeWidth={1} />
                            <span className="text-[13px] font-black tracking-widest uppercase">Görsel Yok</span>
                        </div>
                    )}
                    {product.campaign && (
                        <div className="absolute top-6 right-6 bg-emerald-100/90 text-emerald-700 text-[11px] font-black px-4 py-2 rounded-xl border border-emerald-200 shadow-sm uppercase z-10 backdrop-blur-sm">
                            {product.campaign.name || "KAMPANYALI ÜRÜN"}
                        </div>
                    )}
                </div>

                {/* SAĞ BÖLÜM: İÇERİKLER VE BUTONLAR */}
                <div className="w-[60%] flex flex-col pt-2 min-w-0">
                    <h1 className="text-[44px] font-black leading-[1.1] tracking-tight mb-10">
                        {product.name}
                    </h1>

                    <div className="flex flex-col gap-8 mb-10 pb-10 border-b border-slate-100">
                        {/* FİYAT ALANI (ÜST) */}
                        <div className="flex items-end gap-12">
                            {hideB2bPrice ? (
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">SATICININ FİYATI</span>
                                    <span className="text-[54px] font-black leading-none tracking-tighter">{fmt(product.basePrice || product.priceResolved)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">LİSTE FİYATI</span>
                                        <span className="text-3xl font-bold text-slate-300 line-through tracking-tight">{fmt(product.basePrice || product.priceResolved)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" /> SİZE ÖZEL
                                        </span>
                                        <span className="text-[54px] font-black leading-none tracking-tighter">{fmt(product.priceResolved)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* PARAPUAN VE KAMPANYA ALANI (EŞİT BÜYÜKLÜKTE, ALT YANA) */}
                        {(earnPoints > 0 || product.campaign) && (
                            <div className="flex flex-wrap gap-4">
                                {earnPoints > 0 && (
                                    <div className="w-full sm:w-[220px] bg-amber-50 text-amber-600 font-black px-5 py-4 rounded-xl border border-amber-200 shadow-sm flex items-center gap-4 shrink-0">
                                        <div className="bg-amber-100 p-2 rounded-lg text-amber-500"><Coins size={24} strokeWidth={2.5} /></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] uppercase tracking-[0.1em] opacity-80 leading-none mb-1.5">PARAPUAN</span>
                                            <span className="text-[15px] leading-none truncate">+{earnPoints.toLocaleString('tr-TR')} PUAN</span>
                                        </div>
                                    </div>
                                )}
                                {product.campaign && (
                                    <div className="w-full sm:w-[220px] bg-emerald-50 text-emerald-600 font-black px-5 py-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-4 shrink-0">
                                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-500"><ShoppingCart size={24} strokeWidth={2.5} /></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] uppercase tracking-[0.1em] opacity-80 leading-none mb-1.5">KAMPANYA</span>
                                            <span className="text-[15px] leading-none truncate" title={product.campaign.name || "AKTİF"}>{product.campaign.name || "AKTİF"}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mb-10">
                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 block">ÜRÜN AÇIKLAMASI</span>
                        <p className="text-slate-500 text-[16px] leading-relaxed max-w-2xl font-medium">
                            {product.description || "Bu ürün için detaylı açıklama bulunmuyor. Özellikleri ve ticari avantajları hakkında satıcı bayiniz ile iletişime geçebilirsiniz."}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pb-12 mb-12 border-b border-slate-100">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">STOK DURUMU</span>
                            <div className={`text-[15px] font-black uppercase flex items-center gap-2 ${stock > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                <div className={`w-2 h-2 rounded-full ${stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} /> {stock > 0 ? `STOK: ${stock} ADET` : "TÜKENDİ"}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SKU / KOD</span>
                             <div className="text-[15px] font-black uppercase truncate">{product.sku}</div>
                        </div>
                        <div className="space-y-1.5">
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">KATEGORİ</span>
                             <div className="text-[15px] font-black uppercase">{product.category || "Diğer"}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 mt-auto">
                        <div className="flex items-center justify-between w-[160px] h-[64px] bg-white border border-slate-200 rounded-2xl p-2 shadow-sm shrink-0">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"><Minus size={20} /></button>
                            <input type="text" value={quantity} readOnly className="w-10 text-center font-black text-[20px] bg-transparent border-none focus:ring-0 p-0" />
                            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"><Plus size={20} /></button>
                        </div>
                        <button disabled={stock === 0 || addingToCart} onClick={handleAddToCart} className="flex-1 h-[64px] bg-blue-600 text-white rounded-2xl font-black text-[16px] hover:bg-blue-700 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-[0.1em]">
                            {addingToCart ? <Loader2 size={24} className="animate-spin" /> : <>SEPETE EKLE</>}
                        </button>
                        <button disabled={stock === 0} className="w-[180px] h-[64px] border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-[16px] hover:bg-slate-900 hover:text-white transition-all uppercase tracking-[0.1em]">
                            HEMEN AL
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
