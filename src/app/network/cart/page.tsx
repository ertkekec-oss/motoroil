"use client"

import { useEffect, useState } from "react"
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
    summary: { grandTotal: number; currency?: "TRY" }
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

        const res = await fetch("/api/network/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), paymentMode }),
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

                        <div className="divide-y divide-slate-100">
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
                                    <div key={it.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                                        <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-white p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                            {it.imageUrl ? (
                                                <img src={it.imageUrl} alt={it.name} className="w-full h-full object-contain mix-blend-multiply filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <PackageOpen className="text-slate-300 w-8 h-8" strokeWidth={1.5} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-slate-900 text-[15px] truncate mb-1.5 group-hover:text-blue-600 transition-colors">{it.name}</div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 flex-wrap mb-2">
                                                {it.code && <span className="uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">{it.code}</span>}
                                                <span className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${it.stockQty > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} /> Stok: {it.stockQty} {it.unit ?? "Adet"}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {it.effectivePrice !== it.listPrice && (
                                                    <span className="text-xs font-semibold text-slate-400 line-through">
                                                        {fmt(it.listPrice)}
                                                    </span>
                                                )}
                                                <span className="font-black text-[17px] text-slate-900 tracking-tight">{fmt(it.effectivePrice)}</span>
                                                <span className="text-[11px] font-bold text-slate-400/80 uppercase tracking-widest bg-slate-100/50 px-1.5 py-0.5 rounded"> / {it.unit ?? "ADET"}</span>
                                            </div>
                                            {(it as any).campaignMessage && (
                                                <div className="mt-3 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 inline-flex items-center gap-2 shadow-sm uppercase tracking-wide">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    {(it as any).campaignMessage}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6 w-full sm:w-auto mt-4 sm:mt-0 justify-between sm:justify-end shrink-0">
                                            <QtyControl
                                                value={it.quantity}
                                                disabled={busyItemId === it.productId || busyItemId === it.id}
                                                onChange={(v) => updateQty(it.productId, v)}
                                                max={it.stockQty}
                                            />

                                            <div className="text-right w-28 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Tutar</div>
                                                <div className="font-black text-[#1a1a1a]">{fmt(it.lineTotal)}</div>
                                            </div>

                                            <button
                                                onClick={() => removeItem(it.id)}
                                                disabled={busyItemId === it.id}
                                                className="w-10 h-10 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-500"
                                                title="Sepetten çıkar"
                                            >
                                                {busyItemId === it.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" strokeWidth={2.5} />}
                                            </button>
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
                            <Row
                                label="Genel Toplam"
                                value={fmt(cart?.summary?.grandTotal ?? 0)}
                                strong
                            />

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
    const canDec = value > 1 && !disabled
    const canInc = value < max && !disabled

    return (
        <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden h-10 shadow-sm">
            <button
                className="h-full w-10 hover:bg-muted/40 disabled:opacity-50 text-muted-foreground outline-none focus:bg-muted/40"
                disabled={!canDec}
                onClick={() => onChange(value - 1)}
                type="button"
            >
                −
            </button>
            <div className="h-full w-10 flex items-center justify-center text-sm font-medium">
                {value}
            </div>
            <button
                className="h-full w-10 hover:bg-muted/40 disabled:opacity-50 text-muted-foreground outline-none focus:bg-muted/40"
                disabled={!canInc}
                onClick={() => onChange(value + 1)}
                type="button"
            >
                +
            </button>
        </div>
    )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={strong ? "text-lg font-semibold text-foreground" : "text-sm font-medium"}>{value}</div>
        </div>
    )
}

function fmt(v: number) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v)
}
