"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Item = {
    id: string
    name: string
    sku: string | null
    brand: string | null
    unit: string | null
    listPrice: number
    effectivePrice: number
    discountPct: number
    stockQty: number
}

// Minimal header hook (or manually fetched inside same file as bonus)
type Me = {
    supplierName: string
}

export default function CatalogPage() {
    const [me, setMe] = useState<Me | null>(null)
    const [q, setQ] = useState("")
    const [items, setItems] = useState<Item[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [addingId, setAddingId] = useState<string | null>(null)

    const queryKey = useMemo(() => q.trim(), [q])

    // Fetch /network/me just for the Header
    useEffect(() => {
        fetch("/api/network/me", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
                if (data?.ok && data.me) setMe(data.me)
            })
            .catch(() => null)
    }, [])

    // debounce
    useEffect(() => {
        const t = setTimeout(() => {
            loadFirst()
        }, 300)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryKey])

    async function loadFirst() {
        setLoading(true)
        setErr(null)
        setItems([])
        setCursor(null)

        const res = await fetch(`/api/network/catalog/products?q=${encodeURIComponent(queryKey)}`, {
            cache: "no-store",
        })
        const data = await res.json().catch(() => null)

        if (!res.ok || !data?.ok) {
            setErr("Katalog yüklenemedi. Lütfen tekrar deneyin.")
            setLoading(false)
            return
        }

        setItems(data.items || [])
        setCursor(data.nextCursor || null)
        setLoading(false)
    }

    async function loadMore() {
        if (!cursor) return
        setLoadingMore(true)
        setErr(null)

        const res = await fetch(
            `/api/network/catalog/products?q=${encodeURIComponent(queryKey)}&cursor=${encodeURIComponent(cursor)}`,
            { cache: "no-store" }
        )
        const data = await res.json().catch(() => null)

        if (!res.ok || !data?.ok) {
            setErr("Devamı yüklenemedi.")
            setLoadingMore(false)
            return
        }

        setItems((prev) => [...prev, ...(data.items || [])])
        setCursor(data.nextCursor || null)
        setLoadingMore(false)
    }

    async function addToCart(productId: string) {
        setAddingId(productId)
        setErr(null)
        const res = await fetch("/api/network/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ productId, quantity: 1 }),
        })
        const data = await res.json().catch(() => null)
        setAddingId(null)

        if (!res.ok || !data?.ok) {
            if (data?.error === "INSUFFICIENT_STOCK") {
                setErr("Yetersiz stok durumu. Belirtilen miktarda eklenemiyor.")
            } else {
                setErr("Ürün sepete eklenemedi. Lütfen tekrar deneyin.")
            }
        }
    }

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Periodya Dealer Network</div>
                        <h1 className="text-2xl font-semibold">
                            {me?.supplierName ? `${me.supplierName} Kataloğu` : "Katalog"}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Fiyatlar üyeliğine göre otomatik iskontoludur.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/network/cart"
                            className="h-10 px-4 inline-flex items-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold transition-colors"
                        >
                            Sepete Git
                        </Link>
                        <Link
                            href="/network"
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/network/select-supplier"
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Tedarikçi Değiştir
                        </Link>
                    </div>
                </div>

                <div className="mb-4 flex gap-3">
                    <input
                        className="h-11 w-full rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Ürün ara: isim, sku, barkod…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <button
                        className="h-11 px-6 rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        onClick={loadFirst}
                    >
                        Ara
                    </button>
                </div>

                {err && (
                    <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <div className="font-medium text-destructive">Hata</div>
                        <div className="text-muted-foreground mt-1">{err}</div>
                    </div>
                )}

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="p-4 border-b text-sm text-muted-foreground">
                        {loading ? "Yükleniyor…" : `${items.length} ürün listelendi`}
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <div className="p-6 text-sm text-muted-foreground">Katalog yükleniyor…</div>
                        ) : items.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground">Ürün bulunamadı.</div>
                        ) : (
                            items.map((it) => (
                                <div key={it.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">{it.name}</div>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                            {it.brand && (
                                                <span className="px-2 py-0.5 rounded-full bg-muted/60 border">{it.brand}</span>
                                            )}
                                            {it.sku && <span>SKU: <span className="font-medium">{it.sku}</span></span>}
                                            <span>Stok: <span className="font-medium">{it.stockQty}</span> {it.unit ?? "Adet"}</span>
                                        </div>
                                    </div>

                                    <div className="flex md:items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                                        <div className="text-left md:text-right">
                                            {it.discountPct > 0 ? (
                                                <div className="text-xs text-muted-foreground line-through">
                                                    {fmt(it.listPrice)}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-transparent select-none">-</div> // Boşluğu korumak için
                                            )}
                                            <div className="text-lg font-semibold text-primary">{fmt(it.effectivePrice)}</div>
                                            {it.discountPct > 0 && (
                                                <div className="text-xs font-medium text-emerald-600">
                                                    %{it.discountPct.toFixed(0)} iskonto
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => addToCart(it.id)}
                                            disabled={addingId === it.id || it.stockQty < 1}
                                            className="h-11 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {addingId === it.id ? "Ekleniyor…" : "Sepete Ekle"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t flex justify-center">
                        {cursor ? (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="h-10 px-6 rounded-xl border bg-card text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                            >
                                {loadingMore ? "Yükleniyor…" : "Daha Fazla Ürün Yükle"}
                            </button>
                        ) : (
                            <div className="text-xs text-muted-foreground py-2">Listenin sonuna geldiniz.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function fmt(v: number) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v)
}
