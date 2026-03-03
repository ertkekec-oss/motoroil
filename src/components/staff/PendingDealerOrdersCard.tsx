"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function PendingDealerOrdersCard() {
    const [count, setCount] = useState<number | null>(null)
    const [paidCount, setPaidCount] = useState<number | null>(null)

    useEffect(() => {
        ; (async () => {
            const res = await fetch("/api/admin/dealer-orders/count?status=PENDING_APPROVAL", { cache: "no-store" })
            const data = await res.json().catch(() => null)
            if (res.ok && data?.ok) setCount(Number(data.count ?? 0))
            else setCount(null)

            const resPaid = await fetch("/api/admin/dealer-orders/count?status=PAID_PENDING_APPROVAL", { cache: "no-store" })
            const dataPaid = await resPaid.json().catch(() => null)
            if (resPaid.ok && dataPaid?.ok) setPaidCount(Number(dataPaid.count ?? 0))
            else setPaidCount(null)
        })()
    }, [])

    return (
        <div className="rounded-2xl border bg-card shadow-sm p-6">
            <div className="text-sm text-muted-foreground">B2B Sipariş Onayı</div>
            <div className="flex items-center justify-between gap-4 mt-2">
                <div>
                    <div className="text-2xl font-semibold">
                        {count === null ? "—" : count}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">Onay bekleyen</div>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-semibold text-emerald-600">
                        {paidCount === null ? "—" : paidCount}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Ödemesi alınmış
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <Link
                    href="/admin/b2b/dealer-orders"
                    className="h-10 px-4 inline-flex items-center rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-95"
                >
                    Kuyruğa Git
                </Link>
            </div>
        </div>
    )
}
