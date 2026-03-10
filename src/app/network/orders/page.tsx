"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { approvalLabel, isPaid } from "@/lib/ui/orderBadges"
import { useNetworkPath } from "@/hooks/useNetworkPath"

type Row = {
    id: string
    orderNumber: string
    status: string
    orderDate: string
    totalAmount: number
    currency: "TRY"
}

export default function OrdersListPage() {
    const getPath = useNetworkPath()
    const [items, setItems] = useState<Row[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const [intentDetail, setIntentDetail] = useState<any | null>(null)
    const [intentLoading, setIntentLoading] = useState(false)

    async function showIntentInfo(e: React.MouseEvent, orderId: string) {
        e.preventDefault()
        setIntentLoading(true)
        setIntentDetail({ id: "loading" }) // dummy state to open drawer with loading
        const res = await fetch(`/api/network/payments/intents/by-order/${encodeURIComponent(orderId)}`)
        const data = await res.json().catch(() => null)
        if (res.ok && data?.ok && data.intent) {
            setIntentDetail(data.intent)
        } else {
            setIntentDetail({ error: "Detay bulunamadı" })
        }
        setIntentLoading(false)
    }

    async function loadFirst() {
        setLoading(true); setErr(null)
        const res = await fetch("/api/network/orders", { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) { setErr("Siparişler alınamadı."); setLoading(false); return }
        setItems(data.items || [])
        setCursor(data.nextCursor || null)
        setLoading(false)
    }

    async function loadMore() {
        if (!cursor) return
        setLoadingMore(true); setErr(null)
        const res = await fetch(`/api/network/orders?cursor=${encodeURIComponent(cursor)}`, { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) { setErr("Devamı alınamadı."); setLoadingMore(false); return }
        setItems((p) => [...p, ...(data.items || [])])
        setCursor(data.nextCursor || null)
        setLoadingMore(false)
    }

    useEffect(() => { loadFirst() }, [])

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Dealer Network</div>
                        <h1 className="text-2xl font-semibold">Siparişler</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Üyeliğin kapsamındaki sipariş geçmişi.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={getPath("/network/dashboard")} className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40">
                            Dashboard
                        </Link>
                        <Link href={getPath("/network/catalog")} className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40">
                            Katalog
                        </Link>
                    </div>
                </div>

                {err && (
                    <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <div className="font-medium text-destructive">Hata</div>
                        <div className="text-muted-foreground mt-1">{err}</div>
                    </div>
                )}

                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                    <div className="p-4 border-b text-sm text-muted-foreground">
                        {loading ? "Yükleniyor…" : `${items.length} kayıt`}
                    </div>

                    {loading ? (
                        <div className="p-6 text-sm text-muted-foreground">Yükleniyor…</div>
                    ) : items.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">Henüz sipariş yok.</div>
                    ) : (
                        <div className="divide-y">
                            {items.map((o) => (
                                <Link key={o.id} href={getPath(`/network/orders/${o.id}`)} className="block p-4 hover:bg-muted/30">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-medium">{o.orderNumber}</div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{new Date(o.orderDate).toLocaleString("tr-TR")}</span>
                                                <span>•</span>
                                                <span>{approvalLabel(o.status)}</span>

                                                {isPaid(o.status) && (
                                                    <>
                                                        <span>•</span>
                                                        <button
                                                            onClick={(e) => showIntentInfo(e, o.id)}
                                                            className="rounded-full border px-2 py-0.5 text-xs text-green-600 border-green-500/30 bg-green-500/10 font-medium hover:bg-green-500/20 transition-colors cursor-pointer"
                                                        >
                                                            Ödeme alındı
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">Toplam</div>
                                            <div className="font-semibold">{fmt(o.totalAmount)}</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="p-4 border-t flex justify-center">
                        {cursor ? (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="h-10 px-4 rounded-xl border bg-card text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                            >
                                {loadingMore ? "Yükleniyor…" : "Daha Fazla"}
                            </button>
                        ) : (
                            <div className="text-xs text-muted-foreground">Sayfa sonu</div>
                        )}
                    </div>
                </div>
            </div>

            {intentDetail && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setIntentDetail(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-background border-l shadow-xl overflow-y-auto">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Ödeme Detayı</h2>
                            <button onClick={() => setIntentDetail(null)} className="h-8 w-8 inline-flex items-center justify-center rounded border bg-card hover:bg-muted/40 text-muted-foreground">
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            {intentDetail.id === "loading" ? (
                                <div className="text-sm text-muted-foreground">Yükleniyor…</div>
                            ) : intentDetail.error ? (
                                <div className="text-sm text-destructive">{intentDetail.error}</div>
                            ) : (
                                <div className="grid gap-4">
                                    <div className="rounded-xl border bg-card p-4 text-sm">
                                        <div className="text-muted-foreground mb-1">Durum</div>
                                        <div className="font-semibold text-foreground">{intentDetail.status}</div>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4 text-sm">
                                        <div className="text-muted-foreground mb-1">Sağlayıcı</div>
                                        <div className="font-medium text-foreground">{intentDetail.provider}</div>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4 text-sm">
                                        <div className="text-muted-foreground mb-1">Referans Kodu</div>
                                        <div className="font-medium text-foreground truncate" title={intentDetail.referenceCode}>{intentDetail.referenceCode || "—"}</div>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4 text-sm">
                                        <div className="text-muted-foreground mb-1">Ödenen Tutar</div>
                                        <div className="font-medium text-foreground">
                                            {intentDetail.paidAmount ? fmt(Number(intentDetail.paidAmount)) : "—"}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4 text-sm">
                                        <div className="text-muted-foreground mb-1">Doğrulama Tarihi</div>
                                        <div className="font-medium text-foreground">
                                            {intentDetail.verifiedAt ? new Date(intentDetail.verifiedAt).toLocaleString("tr-TR") : "—"}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function fmt(v: number) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v)
}
