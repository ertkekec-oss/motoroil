"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type OrderRow = {
    id: string
    orderNumber: string
    customerName: string
    orderDate: string
    totalAmount: number
    currency: string
    status: "PENDING_APPROVAL" | "PAID_PENDING_APPROVAL" | "APPROVED" | "REJECTED" | string
    paid?: boolean
}

export default function StaffDealerOrdersPage() {
    const [items, setItems] = useState<OrderRow[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    const [selected, setSelected] = useState<OrderRow | null>(null)
    const [detail, setDetail] = useState<any | null>(null)
    const [busy, setBusy] = useState(false)
    const [rejectReason, setRejectReason] = useState("")

    async function load() {
        setLoading(true)
        setErr(null)
        const res = await fetch("/api/staff/dealer-orders?status=PENDING_APPROVAL,PAID_PENDING_APPROVAL", { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) {
            setErr("Onay kuyruğu yüklenemedi.")
            setLoading(false)
            return
        }
        setItems(data.items || [])
        setLoading(false)
    }

    async function openDetail(o: OrderRow) {
        setSelected(o)
        setDetail(null)
        setRejectReason("")
        const res = await fetch(`/api/staff/dealer-orders/${encodeURIComponent(o.id)}`, { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) {
            setErr("Sipariş detayı alınamadı.")
            return
        }
        setDetail(data.order)
    }

    async function approve(id: string) {
        setBusy(true); setErr(null)
        const res = await fetch(`/api/staff/dealer-orders/${encodeURIComponent(id)}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({}),
        })
        const data = await res.json().catch(() => null)
        setBusy(false)

        if (!res.ok || !data?.ok) {
            setErr("Onay işlemi başarısız.")
            return
        }
        setSelected(null); setDetail(null)
        await load()
    }

    async function reject(id: string) {
        if (!rejectReason.trim()) {
            setErr("Reddetme nedeni gir.")
            return
        }
        setBusy(true); setErr(null)
        const res = await fetch(`/api/staff/dealer-orders/${encodeURIComponent(id)}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ reason: rejectReason.trim().slice(0, 240) }),
        })
        const data = await res.json().catch(() => null)
        setBusy(false)

        if (!res.ok || !data?.ok) {
            setErr("Reddetme işlemi başarısız.")
            return
        }
        setSelected(null); setDetail(null)
        await load()
    }

    async function doRefund(id: string, amount: string) {
        setBusy(true); setErr(null)
        const res = await fetch(`/api/staff/dealer-orders/${encodeURIComponent(id)}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
                idempotencyKey: crypto.randomUUID(),
                amount,
                reason: "STAFF_REFUND",
            }),
        })
        const data = await res.json().catch(() => null)
        setBusy(false)

        if (!res.ok || !data?.ok) {
            setErr("İade işlemi başarısız: " + (data?.error || ""));
            return
        }
        setSelected(null); setDetail(null)
        await load()
    }

    useEffect(() => { load() }, [])

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Staff</div>
                        <h1 className="text-2xl font-semibold">B2B Sipariş Onayı</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Dealer B2B siparişlerini onayla veya reddet.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={load}
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Yenile
                        </button>
                        <Link
                            href="/staff"
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Panel
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
                        {loading ? "Yükleniyor…" : `${items.length} bekleyen sipariş`}
                    </div>

                    {loading ? (
                        <div className="p-6 text-sm text-muted-foreground">Yükleniyor…</div>
                    ) : items.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">Bekleyen sipariş yok.</div>
                    ) : (
                        <div className="divide-y">
                            {items.map((o) => (
                                <button
                                    key={o.id}
                                    onClick={() => openDetail(o)}
                                    className="w-full text-left p-4 hover:bg-muted/30"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-medium">{o.orderNumber}</div>
                                            <div className="mt-1 text-xs text-muted-foreground truncate">
                                                {o.customerName} • {new Date(o.orderDate).toLocaleString("tr-TR")}
                                                {o.paid && (
                                                    <span className="ml-2 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-600 font-medium">
                                                        Ödeme alındı
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">Toplam</div>
                                            <div className="font-semibold">{fmt(o.totalAmount, o.currency)}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Drawer */}
            {selected && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/30" onClick={() => !busy && setSelected(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-background border-l shadow-xl overflow-y-auto">
                        <div className="p-6 border-b flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Sipariş</div>
                                <div className="text-xl font-semibold">{selected.orderNumber}</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    {selected.customerName} • {new Date(selected.orderDate).toLocaleString("tr-TR")}
                                </div>
                            </div>
                            <button
                                className="h-10 px-4 rounded-xl border bg-card text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                                onClick={() => setSelected(null)}
                                disabled={busy}
                            >
                                Kapat
                            </button>
                        </div>

                        <div className="p-6">
                            {!detail ? (
                                <div className="text-sm text-muted-foreground">Detay yükleniyor…</div>
                            ) : (
                                <>
                                    <div className="rounded-2xl border bg-card p-4">
                                        <div className="text-sm text-muted-foreground">Özet</div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="text-sm">Durum</div>
                                            <div className="text-sm font-medium">
                                                {statusLabel(detail.status)}
                                                {detail.paid && (
                                                    <span className="ml-2 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-600 font-medium">
                                                        Ödeme alındı
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="text-sm">Toplam</div>
                                            <div className="text-sm font-semibold">{fmt(detail.totalAmount, detail.currency)}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl border bg-card overflow-hidden">
                                        <div className="p-4 border-b text-sm text-muted-foreground">Kalemler</div>
                                        <div className="divide-y">
                                            {(detail.items || []).map((it: any, idx: number) => (
                                                <div key={idx} className="p-4 flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">{it.name}</div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            {it.code ? `Kod: ${it.code} • ` : ""}
                                                            Adet: {it.quantity} {it.unit ?? ""}
                                                        </div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Liste: {fmt(it.listPrice, detail.currency)} • Bayi:{" "}
                                                            <span className="font-medium">{fmt(it.unitPrice, detail.currency)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-muted-foreground">Tutar</div>
                                                        <div className="font-semibold">{fmt(it.lineTotal, detail.currency)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-3">
                                        <button
                                            onClick={() => approve(detail.id)}
                                            disabled={busy || (detail.status !== "PENDING_APPROVAL" && detail.status !== "PAID_PENDING_APPROVAL")}
                                            className="h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
                                        >
                                            {busy ? "İşleniyor…" : "Onayla"}
                                        </button>

                                        {detail.paid && ["PAID_PENDING_APPROVAL", "PAID"].includes(detail.status) && (
                                            <button
                                                onClick={() => doRefund(detail.id, String(detail.totalAmount))}
                                                disabled={busy}
                                                className="h-11 rounded-xl border bg-card text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                            >
                                                {busy ? "İşleniyor…" : "İade Et"}
                                            </button>
                                        )}

                                        <div className="rounded-2xl border bg-card p-4">
                                            <div className="text-sm font-medium">Reddet</div>
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                Reddetme durumunda stoklar otomatik iade edilir.
                                            </div>
                                            {detail.paid && (
                                                <div className="mt-3 rounded-xl border bg-muted/20 p-3 text-sm">
                                                    Bu sipariş için ödeme alınmış. Reddetme durumunda stok iadesi çalışır; iade/iptal politikası doğrultusunda ilerleyin.
                                                </div>
                                            )}
                                            <textarea
                                                className="mt-3 w-full min-h-[90px] rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                                placeholder="Reddetme nedeni (kısa)"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                disabled={busy || (detail.status !== "PENDING_APPROVAL" && detail.status !== "PAID_PENDING_APPROVAL")}
                                            />
                                            <button
                                                onClick={() => reject(detail.id)}
                                                disabled={busy || (detail.status !== "PENDING_APPROVAL" && detail.status !== "PAID_PENDING_APPROVAL")}
                                                className="mt-3 h-11 w-full rounded-xl border bg-card text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                                            >
                                                {busy ? "İşleniyor…" : "Reddet"}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t text-xs text-muted-foreground">
                            Not: Bu ekran sadece tedarikçi tenant kapsamındaki B2B siparişlerini gösterir.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function fmt(v: number, currency: string) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: currency || "TRY" }).format(v || 0)
}
function statusLabel(s: string) {
    if (s === "PENDING_APPROVAL") return "Onay bekliyor"
    if (s === "PAID_PENDING_APPROVAL") return "Onay bekliyor"
    if (s === "APPROVED") return "Onaylandı"
    if (s === "REJECTED") return "Reddedildi"
    if (s === "REFUND_PENDING") return "İade bekleniyor"
    if (s === "REFUNDED") return "İade edildi"
    if (s === "REFUND_FAILED") return "İade başarısız"
    return s
}
