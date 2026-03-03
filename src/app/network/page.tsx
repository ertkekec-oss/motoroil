"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Me = {
    dealerCompanyName: string | null
    supplierName: string
    creditLimit: number
    balance: number
    currency: "TRY"
}

export default function NetworkDashboardPage() {
    const [me, setMe] = useState<Me | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        ; (async () => {
            setLoading(true)
            setErr(null)
            const res = await fetch("/api/network/me", { cache: "no-store" })
            const data = await res.json().catch(() => null)

            if (!res.ok || !data?.ok) {
                setErr("Dashboard bilgisi alınamadı.")
                setLoading(false)
                return
            }

            setMe(data.me)
            setLoading(false)
        })()
    }, [])

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Periodya Dealer Network</div>
                        <h1 className="text-2xl font-semibold">{me?.supplierName ?? "…"}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {me?.dealerCompanyName ? `Bayi: ${me.dealerCompanyName}` : "Bayi hesabın"}
                        </p>
                    </div>

                    <Link
                        href="/network/select-supplier"
                        className="h-10 px-4 inline-flex items-center rounded-xl border bg-card text-sm font-medium hover:bg-muted/40"
                    >
                        Tedarikçi Değiştir
                    </Link>
                </div>

                {err && (
                    <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <div className="font-medium text-destructive">Hata</div>
                        <div className="text-muted-foreground mt-1">{err}</div>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                    <Card title="Kredi Limiti">
                        {loading ? "…" : formatMoney(me?.creditLimit ?? 0, me?.currency ?? "TRY")}
                    </Card>
                    <Card title="Bakiye">
                        {loading ? "…" : formatMoney(me?.balance ?? 0, me?.currency ?? "TRY")}
                    </Card>
                    <Card title="Kullanım">
                        {loading ? "…" : percentUsage(me?.balance ?? 0, me?.creditLimit ?? 0)}
                    </Card>
                </div>

                <div className="mt-6 rounded-2xl border bg-card shadow-sm">
                    <div className="p-6 border-b">
                        <div className="font-semibold">Hızlı İşlemler</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            V1: kataloğu görüntüle ve tedarikçine göre ürünleri incele.
                        </div>
                    </div>
                    <div className="p-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/network/catalog"
                            className="h-11 px-6 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium"
                        >
                            Kataloğa Git
                        </Link>

                        <Link
                            href="/network/cart"
                            className="h-11 px-6 inline-flex items-center justify-center rounded-xl font-medium border bg-card text-foreground hover:bg-muted/40"
                        >
                            Sepete Git
                        </Link>

                        <Link
                            href="/network/orders"
                            className="h-11 px-6 inline-flex items-center justify-center rounded-xl font-medium border bg-card text-foreground hover:bg-muted/40"
                        >
                            Siparişlerim
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border bg-card shadow-sm p-6">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="mt-2 text-xl font-semibold">{children}</div>
        </div>
    )
}

function formatMoney(value: number, currency: string) {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(value)
}

function percentUsage(balance: number, limit: number) {
    if (!limit || limit <= 0) return "—"
    const pct = Math.min(100, Math.max(0, (balance / limit) * 100))
    return `${pct.toFixed(0)}%`
}
