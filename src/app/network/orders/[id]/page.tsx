"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { approvalLabel, isPaid, paymentLabel } from "@/lib/ui/orderBadges"
import { useNetworkPath } from "@/hooks/useNetworkPath"

type OrderItem = {
    id: string
    productId: string
    name: string
    code: string | null
    barcode: string | null
    quantity: number
    unit: string | null
    unitPrice: number
    listPrice: number
    discountPct: number
    lineTotal: number
}

type OrderData = {
    id: string
    orderNumber: string
    status: string
    orderDate: string
    totalAmount: number
    currency: string
    items: OrderItem[]
}

export default function OrderSuccessPage() {
    const getPath = useNetworkPath()
    const { id } = useParams()
    const [order, setOrder] = useState<OrderData | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        let isMounted = true

        async function load() {
            setLoading(true)
            const res = await fetch(`/api/network/orders/${id}`, { cache: "no-store" })
            const data = await res.json().catch(() => null)

            if (!isMounted) return

            if (!res.ok || !data?.ok) {
                setErr("Sipariş bilgileri yüklenemedi.")
            } else {
                setOrder(data.order)
            }
            setLoading(false)
        }

        load()

        return () => { isMounted = false }
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-background px-4 py-20 flex justify-center text-muted-foreground">
                Sipariş detayları yükleniyor…
            </div>
        )
    }

    if (err || !order) {
        return (
            <div className="min-h-screen bg-background px-4 py-10">
                <div className="mx-auto w-full max-w-2xl text-center">
                    <div className="rounded-2xl border bg-card p-10 shadow-sm">
                        <h1 className="text-xl font-semibold text-destructive mb-2">Hata</h1>
                        <p className="text-muted-foreground">{err || "Sipariş bulunamadı"}</p>
                        <div className="mt-8">
                            <Link
                                href={getPath("/network/dashboard")}
                                className="h-11 px-6 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium"
                            >
                                Dashboard'a Dön
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-4xl">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium text-sm mb-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Siparişiniz Başarıyla Oluşturuldu
                        </div>
                        <h1 className="text-3xl font-semibold text-foreground">Sipariş: {order.orderNumber}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {new Date(order.orderDate).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={getPath("/network/catalog")}
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Yeni Sipariş
                        </Link>
                        <Link
                            href={getPath("/network/dashboard")}
                            className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-muted/20 text-sm font-semibold flex items-center justify-between">
                            <span>Durum: <span className="text-amber-600 uppercase ml-1 px-2 py-[2px] rounded bg-amber-500/10 text-xs">{approvalLabel(order.status)}</span></span>
                            <div className="flex flex-col items-end">
                                <span>{paymentLabel(order.status)}</span>
                                {isPaid(order.status) && (
                                    <span className="text-xs text-muted-foreground font-normal mt-0.5">Sipariş için ödeme alınmıştır.</span>
                                )}
                            </div>
                        </div>

                        <div className="divide-y">
                            {order.items?.map((it, idx) => (
                                <div key={`${it.id}-${idx}`} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate text-foreground">{it.name}</div>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                            {it.code && <span>SKU: {it.code}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8 text-sm">
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground mb-1">Miktar</div>
                                            <div className="font-medium">{it.quantity} {it.unit ?? "Adet"}</div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground mb-1">Birim (Özel)</div>
                                            <div className="font-medium">{fmt(it.unitPrice)}</div>
                                        </div>

                                        <div className="text-right min-w-[90px]">
                                            <div className="text-xs text-muted-foreground mb-1">Toplam</div>
                                            <div className="font-semibold text-foreground">{fmt(it.lineTotal)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t bg-muted/10 flex justify-end">
                            <div className="w-full sm:w-64 space-y-2">
                                <div className="flex justify-between text-base font-semibold border-b border-border/50 pb-2">
                                    <span>Genel Toplam:</span>
                                    <span className="text-primary">{fmt(Number(order.totalAmount))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function fmt(v: number) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v)
}
