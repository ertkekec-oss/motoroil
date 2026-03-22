"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { Trash2, PackageOpen, ShoppingCart, Loader2 } from "lucide-react"

type CartItem = {
    id: string
    productId: string
    name: string
    code: string | null
    stockQty: number
    quantity: number
    unit: string | null
    listPrice: number
    effectivePrice: number
    lineTotal: number
    imageUrl: string | null
}

type CartData = {
    id: string
    items: CartItem[]
    summary: { grandTotal: number; subTotal: number; totalDiscount: number; shippingFee: number; shippingCost: number; freeShippingThreshold: number; availablePoints?: number; earnablePoints?: number; currency?: "TRY" }
}

export default function CartPage() {
    const getPath = useNetworkPath()
    const [cart, setCart] = useState<CartData | null>(null)
    const [credit, setCredit] = useState<{ creditLimit: number; exposureBase: number; availableCredit: number; creditPolicy?: string } | null>(null)
    const [paymentMode, setPaymentMode] = useState<"ON_ACCOUNT" | "CARD">("ON_ACCOUNT")
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [busyItemId, setBusyItemId] = useState<string | null>(null)
    const [checkingOut, setCheckingOut] = useState(false)
    const [usePoints, setUsePoints] = useState(false)

    async function load(isBgLoad = false) {
        if (!isBgLoad) setLoading(true)
        setErr(null)
        const [cartRes, creditRes] = await Promise.all([
            fetch("/api/network/cart", { cache: "no-store" }),
            fetch("/api/network/credit", { cache: "no-store" })
        ])

        const data = await cartRes.json().catch(() => null)
        const creditData = await creditRes.json().catch(() => null)

        if (!cartRes.ok || !data?.ok) {
            setErr("Sepet yüklenemedi.")
            if (!isBgLoad) setLoading(false)
            return
        }
        setCart(data.cart)
        if (creditData?.ok) {
            setCredit(creditData)
        }
        if (!isBgLoad) setLoading(false)
    }

    useEffect(() => {
        load(false)
    }, [])

    const grandTotal = cart?.summary?.grandTotal || 0
    const availableCredit = credit?.availableCredit || 0
    // Fix: 0 limit means 0 credit, not unlimited!
    const limitExceeded = credit !== null && grandTotal > availableCredit
    const creditPolicy = credit?.creditPolicy || "HARD_LIMIT"
    
    // Yalnızca Hard Limit veya Force Card on Limit politikalarında açık hesap engellenir
    const isAccountBlocked = limitExceeded && (creditPolicy === "HARD_LIMIT" || creditPolicy === "FORCE_CARD_ON_LIMIT")

    useEffect(() => {
        if (isAccountBlocked && paymentMode === "ON_ACCOUNT") {
            setPaymentMode("CARD")
        }
    }, [isAccountBlocked, paymentMode])

    const hasItems = (cart?.items?.length || 0) > 0

    async function updateQty(productId: string, nextQty: number) {
        if (!cart) return
        if (nextQty < 1) return
        setBusyItemId(productId)
        setErr(null)

        const res = await fetch("/api/network/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ productId, quantity: nextQty, isUpdate: true }),
        })
        const data = await res.json().catch(() => null)
        setBusyItemId(null)

        if (!res.ok || !data?.ok) {
            if (data?.error === "INSUFFICIENT_STOCK") {
                setErr("Yetersiz stok durumu.")
            } else {
                setErr("Miktar güncellenemedi.")
            }
            return
        }
        await load(true)
    }

    async function removeItem(cartItemId: string) {
        if (!cart) return
        setBusyItemId(cartItemId)
        setErr(null)

        const res = await fetch(`/api/network/cart/items/${encodeURIComponent(cartItemId)}`, {
            method: "DELETE",
            cache: "no-store",
        })
        const data = await res.json().catch(() => null)
        setBusyItemId(null)

        if (!res.ok || !data?.ok) {
            setErr("Ürün sepetten çıkarılamadı.")
            return
        }
        await load(true)
    }

    async function handleCheckout() {
        setCheckingOut(true)
        setErr(null)

        if (!cart) {
            setErr("Sepet bilgisi bulunamadı.")
            setCheckingOut(false)
            return
        }

        const installments = 0; // Assuming 0 installments if not explicitly managed by state
        const res = await fetch("/api/network/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cartId: cart.id,
                paymentMode,
                installments,
                usePoints,
            }),
            cache: "no-store",
        })

        const data = await res.json().catch(() => null)

        if (!res.ok || !data?.ok) {
            setCheckingOut(false)
            if (data?.error === "INSUFFICIENT_STOCK") {
                setErr("Bazı ürünlerin stoğu yetersiz. Lütfen miktarları güncelleyin.")
            } else if (data?.error === "INSUFFICIENT_CREDIT_LIMIT") {
                setErr("Limit aşımı! Lütfen ödeme yöntemi olarak 'Kredi Kartı' seçiniz.")
                setPaymentMode("CARD")
            } else {
                setErr(`Sipariş oluşturulamadı (${data?.error || "Hata"}).`)
            }
            return
        }

        // Success redirect
        window.location.href = getPath(`/network/orders/${data.orderId}`)
    }

    const effectiveCredit = credit?.availableCredit || 0;
    const isAccountBlockedWithPoints = paymentMode === "ON_ACCOUNT" && Math.max(0, (cart?.summary?.grandTotal ?? 0) - (usePoints ? (cart?.summary?.availablePoints ?? 0) : 0)) > effectiveCredit;

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Periodya Dealer Network</div>
                        <h1 className="text-2xl font-semibold">Sepeti Görüntüle</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Fiyatlar anlıktır; sipariş oluşturulduğunda sözleşme gereği mühürlenir.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={getPath("/network/catalog")}
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Kataloğa Dön
                        </Link>
                        <Link
                            href={getPath("/network/dashboard")}
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>

                {err && (
                    <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <div className="font-medium text-destructive">Hata</div>
                        <div className="text-muted-foreground mt-1">{err}</div>
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <span className="font-semibold text-slate-900 text-[15px]">Ürünler</span>
                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{loading ? "Yükleniyor…" : `${cart?.items?.length || 0} kalem`}</span>
                        </div>

                        <div className="flex flex-col">
                            {loading && !cart ? (
                                <div className="p-16 flex flex-col items-center justify-center gap-4 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <span className="text-sm font-medium">Sepet yükleniyor...</span>
                                </div>
                            ) : !hasItems ? (
                                <div className="p-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                        <ShoppingCart className="w-8 h-8" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Sepetiniz Boş</h3>
                                    <p className="text-[14px] text-slate-500 max-w-sm">Katalogdan hemen ürün ekleyerek avantajlı b2b fiyatlarıyla alışverişe başlayabilirsiniz.</p>
                                </div>
                            ) : (
                                cart!.items.map((it) => (
                                    <div key={it.id} className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 hover:bg-slate-50/70 transition-colors group border-b border-slate-100 last:border-b-0">
                                        
                                        {/* Left Side: Image + Details */}
                                        <div className="flex items-start gap-4 flex-1 w-full">
                                            {/* Image */}
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-200 bg-white p-2.5 flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden group-hover:border-blue-300 group-hover:shadow-md transition-all duration-300">
                                                {it.imageUrl ? (
                                                    <img src={it.imageUrl} alt={it.name} className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-500 mix-blend-multiply" />
                                                ) : (
                                                    <PackageOpen className="text-slate-200 w-10 h-10" strokeWidth={1.2} />
                                                )}
                                                {it.stockQty <= 5 && it.stockQty > 0 && (
                                                    <div className="absolute top-0 left-0 right-0 bg-rose-500 p-0.5 text-center text-[8px] font-black text-white uppercase tracking-[0.15em] py-1 shadow-sm">
                                                        AZALDI
                                                    </div>
                                                )}
                                            </div>

                                            {/* Core Info */}
                                            <div className="flex flex-col flex-1 min-w-0 pt-0.5">
                                                <div className="font-bold text-slate-900 text-[15px] sm:text-[17px] leading-tight mb-2 group-hover:text-blue-600 transition-colors pr-2 break-words line-clamp-2 tracking-tight">
                                                    {it.name}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                    {it.code && (
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-200/50 leading-none">
                                                            {it.code}
                                                        </span>
                                                    )}
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border leading-none ${it.stockQty > 0 ? 'bg-emerald-50 border-emerald-100/60' : 'bg-rose-50 border-rose-100/60'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${it.stockQty > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${it.stockQty > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {it.stockQty > 0 ? `Stokta ${it.stockQty} ${it.unit ?? "Adet"}` : "Stok Yok"}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2.5">
                                                    <div className="bg-slate-900 text-white px-2 py-1 rounded-lg">
                                                        <span className="font-black text-[16px] sm:text-[18px] tracking-tight">{fmt(it.effectivePrice)}</span>
                                                        <span className="text-[10px] font-bold opacity-60 uppercase ml-1">/ {it.unit ?? "ADET"}</span>
                                                    </div>
                                                    {it.effectivePrice !== it.listPrice && (
                                                        <span className="text-[12px] font-medium text-slate-400 line-through decoration-slate-300">
                                                            {fmt(it.listPrice)}
                                                        </span>
                                                    )}
                                                </div>

                                                {(it as any).campaignMessage && (
                                                    <div className="mt-3 w-fit text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 inline-flex items-center gap-2 shadow-sm uppercase tracking-wide">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        {(it as any).campaignMessage}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side: Actions & Totals */}
                                        <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-transparent shrink-0">
                                            
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 lg:hidden">Miktar</span>
                                                <div className="shadow-sm rounded-xl overflow-hidden bg-white">
                                                    <QtyControl
                                                        value={it.quantity}
                                                        disabled={busyItemId === it.productId || busyItemId === it.id}
                                                        onChange={(v) => updateQty(it.productId, v)}
                                                        max={it.stockQty}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-6">
                                                <div className="flex flex-col items-end min-w-[90px] sm:min-w-[120px] bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100/80">
                                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Toplam</span>
                                                    <span className="font-black text-[18px] text-slate-800 tracking-tight leading-none">{fmt(it.lineTotal)}</span>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(it.id)}
                                                    disabled={busyItemId === it.id}
                                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-transparent sm:bg-white sm:border sm:border-slate-200 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors disabled:opacity-50 shrink-0"
                                                    title="Sepetten çıkar"
                                                >
                                                    {busyItemId === it.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4.5 h-4.5" strokeWidth={2} />}
                                                </button>
                                            </div>
                                            
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_20px_rgb(0,0,0,0.02)] h-fit sticky top-6 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="font-semibold text-slate-900 text-[15px]">Özet Bilgisi</div>
                            <div className="mt-1 text-[13px] text-slate-500 font-medium">Sipariş öncesi canlı hesap</div>
                        </div>

                        {cart?.summary?.availablePoints && cart.summary.availablePoints > 0 ? (
                            <div className="p-5 border-b border-slate-100 bg-purple-50/50">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center shrink-0">
                                        <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} className="peer w-5 h-5 appearance-none border-2 border-purple-200 rounded-md checked:bg-purple-600 checked:border-purple-600 transition-colors" />
                                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 mix-blend-plus-lighter pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <div>
                                        <div className="font-bold text-purple-900 text-[14px]">Parapuan Kullan</div>
                                        <div className="text-[12px] text-purple-700/80 font-medium">Cüzdanda {fmt(cart.summary.availablePoints)} değerinde puan var.</div>
                                    </div>
                                </label>
                            </div>
                        ) : null}

                        <div className="p-6 space-y-4">
                            <Row label="Ara Toplam" value={fmt(cart?.summary?.subTotal ?? 0)} />
                            {cart?.summary?.totalDiscount > 0 && (
                                <Row label="İndirimler" value={`-${fmt(cart?.summary?.totalDiscount)}`} />
                            )}
                            <Row 
                                label="Kargo Tutarı" 
                                value={
                                    cart?.summary?.shippingFee > 0 
                                        ? fmt(cart.summary.shippingFee) 
                                        : (cart?.summary?.shippingCost > 0 ? "Ücretsiz Kargo 🎉" : "Alıcı Ödemeli (—)")
                                } 
                            />
                            <div className="pt-4 border-t border-slate-100" />
                            {usePoints && cart?.summary?.availablePoints && cart.summary.availablePoints > 0 ? (
                                <>
                                    <Row label="İndirimsiz Toplam" value={fmt(cart?.summary?.grandTotal ?? 0)} />
                                    <Row label="Parapuan İndirimi" value={`-${fmt(Math.min(cart.summary.grandTotal, cart.summary.availablePoints))}`} />
                                    <div className="pt-2" />
                                    <Row
                                        label="Kalan Tutar"
                                        value={fmt(Math.max(0, (cart?.summary?.grandTotal ?? 0) - (cart?.summary?.availablePoints ?? 0)))}
                                        strong
                                    />
                                </>
                            ) : (
                                <Row
                                    label="Genel Toplam"
                                    value={fmt(cart?.summary?.grandTotal ?? 0)}
                                    strong
                                />
                            )}

                            {cart?.summary?.earnablePoints && cart.summary.earnablePoints > 0 ? (
                                <div className="mt-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-500/10 p-2 rounded-xl">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-purple-900 text-[14px]">Kazanılacak Parapuan</div>
                                            <div className="text-[12px] text-purple-700/80 font-medium">Bu siparişten hemen sonra cüzdanınıza eklenir</div>
                                        </div>
                                    </div>
                                    <div className="font-black text-purple-700 text-[16px]">
                                        +{cart.summary.earnablePoints.toFixed(0)}
                                    </div>
                                </div>
                            ) : null}

                            {credit && (
                                <div className="pt-5 border-t border-slate-100 space-y-4 mt-5">
                                    <div className="font-semibold text-sm text-slate-900 mb-2">Ödeme Yöntemi</div>

                                    <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMode === "CARD" ? "border-blue-500 bg-blue-50/30" : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"}`}>
                                        <input type="radio" className="mt-1.5 accent-blue-600 w-4 h-4 cursor-pointer" checked={paymentMode === "CARD"} onChange={() => setPaymentMode("CARD")} />
                                        <div>
                                            <div className="font-semibold text-[14px] text-slate-900">Kredi Kartı / Banka Kartı</div>
                                            <div className="text-[12px] text-slate-500 mt-1 font-medium">Güvenli online ödeme sistemi</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${isAccountBlocked ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100" : paymentMode === "ON_ACCOUNT" ? "border-blue-500 bg-blue-50/30" : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"}`}>
                                        <input type="radio" className="mt-1.5 accent-blue-600 w-4 h-4 cursor-pointer" checked={paymentMode === "ON_ACCOUNT"} onChange={() => !isAccountBlocked && setPaymentMode("ON_ACCOUNT")} disabled={isAccountBlocked} />
                                        <div>
                                            <div className="font-semibold text-[14px] text-slate-900">Açık Hesap / Veresiye</div>
                                            {isAccountBlocked ? (
                                                <div className="text-[12px] text-rose-500 mt-1 font-bold">Kredi limitiniz yetersiz ({fmt(availableCredit)} limit)</div>
                                            ) : limitExceeded && creditPolicy === "SOFT_LIMIT" ? (
                                                <div className="text-[12px] text-amber-600 mt-1 font-bold">Limit aşımı (Yönetici Onayına Düşecek)</div>
                                            ) : (
                                                <div className="text-[12px] text-slate-500 mt-1 font-medium">Mevcut cari limitinizden otomatik düşülür</div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            )}

                            <button
                                disabled={!hasItems || checkingOut}
                                onClick={handleCheckout}
                                className="mt-8 w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 font-bold text-white shadow-[0_4px_20px_rgb(59,130,246,0.3)] hover:shadow-[0_4px_25px_rgb(59,130,246,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                            >
                                {checkingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Mühürleniyor…</> : "Siparişi Doğrula & Oluştur"}
                            </button>

                            <div className="text-xs text-muted-foreground text-center pt-2">
                                Sipariş oluşturulduğunda ürün fiyatları ve kalan stoklar Snapshot olarak mühürlenir.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function QtyControl({
    value,
    onChange,
    disabled,
    max,
}: {
    value: number
    onChange: (v: number) => void
    disabled?: boolean
    max: number
}) {
    const [localVal, setLocalVal] = useState(value.toString())
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    
    // Yalnızca dışarıdan gelen value ilk yüklendiğinde VEYA farklıysa güncelle (debouncer çalışmıyorken)
    useEffect(() => {
        if (!timerRef.current) {
            setLocalVal(value.toString())
        }
    }, [value])

    const commitChange = (raw: string, bypassDebounce = false) => {
        let n = parseInt(raw, 10);
        if (isNaN(n) || n < 1) n = 1;
        if (n > max) n = max;
        setLocalVal(n.toString());
        
        if (timerRef.current) clearTimeout(timerRef.current);
        
        if (bypassDebounce) {
            if (n !== value) onChange(n);
        } else {
            timerRef.current = setTimeout(() => {
                if (n !== value) onChange(n);
                timerRef.current = null;
            }, 600); // 600ms debounce
        }
    }

    const currentN = parseInt(localVal, 10) || 1;
    const canDec = currentN > 1 && !disabled;
    const canInc = currentN < max && !disabled;

    return (
        <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden h-10 shadow-sm w-32 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
            <button
                className="h-full w-10 hover:bg-muted/40 disabled:opacity-50 text-muted-foreground outline-none focus:bg-muted/40 shrink-0"
                disabled={!canDec}
                onClick={() => commitChange((currentN - 1).toString())}
                type="button"
            >
                −
            </button>
            <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-full w-12 text-center text-sm font-medium border-none p-0 outline-none focus:ring-0 bg-transparent text-slate-900 mx-auto disabled:opacity-50"
                value={localVal}
                onChange={(e) => {
                    setLocalVal(e.target.value);
                    if (timerRef.current) clearTimeout(timerRef.current);
                }}
                onBlur={(e) => commitChange(e.target.value, false)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.currentTarget.blur();
                        commitChange(e.currentTarget.value, true);
                    }
                }}
                disabled={disabled}
            />
            <button
                className="h-full w-10 hover:bg-muted/40 disabled:opacity-50 text-muted-foreground outline-none focus:bg-muted/40 shrink-0"
                disabled={!canInc}
                onClick={() => commitChange((currentN + 1).toString())}
                type="button"
            >
                +
            </button>
        </div>
    )
}

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
    return (
        <div className={`flex items-center justify-between ${className || ''}`}>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={strong ? "text-lg font-semibold text-foreground" : "text-sm font-medium"}>{value}</div>
        </div>
    )
}

function fmt(v: number) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v)
}
