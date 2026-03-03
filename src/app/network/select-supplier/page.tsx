"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Membership = {
    id: string
    supplierTenantId: string
    supplierName: string
    creditLimit: number
    balance: number
}

export default function SelectSupplierPage() {
    const router = useRouter()
    const [items, setItems] = useState<Membership[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)

    useEffect(() => {
        ; (async () => {
            setLoading(true)
            setErr(null)
            const res = await fetch("/api/network/memberships", { cache: "no-store" })
            const data = await res.json().catch(() => null)

            if (!res.ok || !data?.ok) {
                setErr("Üyelikler alınamadı.")
                setLoading(false)
                return
            }
            setItems(data.memberships || [])
            setLoading(false)

            if ((data.memberships || []).length === 1) {
                const m = data.memberships[0]
                await switchMembership(m.id)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function switchMembership(membershipId: string) {
        setBusyId(membershipId)
        const res = await fetch("/api/network/context/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ membershipId }),
        })
        const data = await res.json().catch(() => null)
        setBusyId(null)

        if (!res.ok || !data?.ok) {
            setErr("Context seçimi başarısız. Lütfen tekrar deneyin.")
            return
        }
        router.push("/network")
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
            <div className="w-full max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="text-sm text-muted-foreground">Periodya</div>
                        <h1 className="text-2xl font-semibold">Tedarikçi Seç</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Devam etmek için bağlı olduğun tedarikçiyi seç.
                        </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                        Active context = Membership
                    </span>
                </div>

                {err && (
                    <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <div className="font-medium text-destructive">Hata</div>
                        <div className="text-muted-foreground mt-1">{err}</div>
                    </div>
                )}

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="p-6 border-b">
                        <div className="text-sm text-muted-foreground">
                            Toplam üyelik: <span className="font-medium text-foreground">{loading ? "…" : items.length}</span>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-sm text-muted-foreground">Yükleniyor…</div>
                        ) : items.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                                Aktif üyelik bulunamadı. Davet linkini kullanarak üyeliğini tamamla.
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {items.map((m) => (
                                    <div key={m.id} className="rounded-2xl border bg-background p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{m.supplierName}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    Limit: {formatTRY(m.creditLimit)} • Bakiye: {formatTRY(m.balance)}
                                                </div>
                                            </div>

                                            <button
                                                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                                                disabled={busyId !== null}
                                                onClick={() => switchMembership(m.id)}
                                            >
                                                {busyId === m.id ? "Seçiliyor…" : "Seç"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                    Not: Tedarikçi seçimi sadece bu üyeliğin kapsamındaki verileri açar.
                </div>
            </div>
        </div>
    )
}

function formatTRY(amount: number) {
    const v = amount || 0
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v)
}
