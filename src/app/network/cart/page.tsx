"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useNetworkPath } from "@/hooks/useNetworkPath"

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
}

type CartData = {
    id: string
    items: CartItem[]
    summary: { grandTotal: number; currency?: "TRY" }
}

export default function CartPage() {
    const getPath = useNetworkPath()
    const [cart, setCart] = useState<CartData | null>(null)
    const [credit, setCredit] = useState<{ creditLimit: number; exposureBase: number; availableCredit: number } | null>(null)
    const [paymentMode, setPaymentMode] = useState<"ON_ACCOUNT" | "CARD">("ON_ACCOUNT")
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [busyItemId, setBusyItemId] = useState<string | null>(null)
    const [checkingOut, setCheckingOut] = useState(false)

    async function load() {
        setLoading(true)
        setErr(null)
        const [cartRes, creditRes] = await Promise.all([
            fetch("/api/network/cart", { cache: "no-store" }),
            fetch("/api/network/credit", { cache: "no-store" })
        ])

        const data = await cartRes.json().catch(() => null)
        const creditData = await creditRes.json().catch(() => null)

        if (!cartRes.ok || !data?.ok) {
            setErr("Sepet yüklenemedi.")
            setLoading(false)
            return
        }
        setCart(data.cart)
        if (creditData?.ok) {
            setCredit(creditData)
        }
        setLoading(false)
    }

    useEffect(() => {
        load()
    }, [])

    const grandTotal = cart?.summary?.grandTotal || 0
    const availableCredit = credit?.availableCredit || 0
    const limitExceeded = (credit?.creditLimit || 0) > 0 && grandTotal > availableCredit

    useEffect(() => {
        if (limitExceeded && paymentMode === "ON_ACCOUNT") {
            setPaymentMode("CARD")
        }
    }, [limitExceeded, paymentMode])

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
            body: JSON.stringify({ productId, quantity: nextQty }),
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
        await load()
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
        await load()
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
                    <div className="lg:col-span-2 rounded-2xl border bg-card shadow-sm">
                        <div className="p-4 border-b text-sm text-muted-foreground">
                            {loading ? "Yükleniyor…" : `${cart?.items?.length || 0} kalem ürün bulunuyor`}
                        </div>

                        <div className="divide-y">
                            {loading ? (
                                <div className="p-6 text-sm text-muted-foreground">Sepet yükleniyor…</div>
                            ) : !hasItems ? (
                                <div className="p-6 text-sm text-muted-foreground">
                                    Sepetin boş. Katalogdan ürün ekleyebilirsin.
                                </div>
                            ) : (
                                cart!.items.map((it) => (
                                    <div key={it.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{it.name}</div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                {it.code && <span>SKU: <span className="font-medium">{it.code}</span></span>}
                                                <span>Stok: <span className="font-medium">{it.stockQty}</span> {it.unit ?? "Adet"}</span>
                                            </div>
                                            <div className="mt-2 text-sm">
                                                {it.effectivePrice !== it.listPrice && (
                                                    <span className="text-xs text-muted-foreground line-through mr-2">
                                                        {fmt(it.listPrice)}
                                                    </span>
                                                )}
                                                <span className="font-semibold text-primary">{fmt(it.effectivePrice)}</span>
                                                <span className="text-xs text-muted-foreground"> / {it.unit ?? "adet"}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-between">
                                            <QtyControl
                                                value={it.quantity}
                                                disabled={busyItemId === it.productId || busyItemId === it.id}
                                                onChange={(v) => updateQty(it.productId, v)}
                                                max={it.stockQty}
                                            />

                                            <div className="text-right w-24">
                                                <div className="text-xs text-muted-foreground">Tutar</div>
                                                <div className="font-semibold">{fmt(it.lineTotal)}</div>
                                            </div>

                                            <button
                                                onClick={() => removeItem(it.id)}
                                                disabled={busyItemId === it.id}
                                                className="h-10 px-3 rounded-xl border bg-card text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                                                title="Sepetten çıkar"
                                            >
                                                {busyItemId === it.id ? "…" : "Sil"}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card shadow-sm h-fit sticky top-6">
                        <div className="p-6 border-b">
                            <div className="font-semibold">Özet</div>
                            <div className="mt-1 text-sm text-muted-foreground">Sipariş öncesi canlı hesap</div>
                        </div>

                        <div className="p-6 space-y-3">
                            <Row label="Ara Toplam" value={fmt(cart?.summary?.grandTotal ?? 0)} />
                            <Row label="Kargo" value="Alıcı Ödemeli (—)" />
                            <div className="pt-3 border-t" />
                            <Row
                                label="Genel Toplam"
                                value={fmt(cart?.summary?.grandTotal ?? 0)}
                                strong
                            />

                            {credit && (
                                <div className="pt-4 border-t space-y-3 mt-4">
                                    <div className="font-semibold text-sm mb-2">Ödeme Yöntemi</div>

                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMode === "CARD" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                        <input type="radio" className="mt-1" checked={paymentMode === "CARD"} onChange={() => setPaymentMode("CARD")} />
                                        <div>
                                            <div className="font-medium text-sm">Kredi Kartı / Banka Kartı</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">Güvenli online ödeme</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${limitExceeded ? "opacity-50 cursor-not-allowed" : ""} ${paymentMode === "ON_ACCOUNT" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                        <input type="radio" className="mt-1" checked={paymentMode === "ON_ACCOUNT"} onChange={() => !limitExceeded && setPaymentMode("ON_ACCOUNT")} disabled={limitExceeded} />
                                        <div>
                                            <div className="font-medium text-sm">Açık Hesap / Veresiye</div>
                                            {limitExceeded ? (
                                                <div className="text-xs text-destructive mt-0.5 font-medium">Kredi limitiniz yetersiz ({fmt(availableCredit)} kullanılabilir)</div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground mt-0.5">Mevcut limitinizden düşülür</div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            )}

                            <button
                                disabled={!hasItems || checkingOut}
                                onClick={handleCheckout}
                                className="mt-6 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                {checkingOut ? "Mühürleniyor…" : "Siparişi Doğrula & Oluştur"}
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
