"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RefundRow = {
    id: string;
    orderId: string;
    provider: string;
    amount: string;
    currency: string;
    status: string;
    createdAt: string;
    providerRefundId?: string | null;
};

export default function RefundsPage() {
    const [status, setStatus] = useState<string>(""); // "", PENDING, SUCCEEDED, FAILED
    const [q, setQ] = useState("");
    const [items, setItems] = useState<RefundRow[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const queryUrl = useMemo(() => {
        const u = new URL("/api/staff/refunds", "http://localhost");
        if (status) u.searchParams.set("status", status);
        if (q.trim()) u.searchParams.set("q", q.trim());
        u.searchParams.set("take", "25");
        if (cursor) u.searchParams.set("cursor", cursor);
        return u.pathname + u.search;
    }, [status, q, cursor]);

    async function load(reset = false) {
        setLoading(true);
        const res = await fetch(queryUrl, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        setLoading(false);

        if (!res.ok || !data?.ok) return;

        if (reset) setItems(data.items);
        else setItems((prev) => [...prev, ...data.items]);

        setCursor(data.nextCursor ?? null);
    }

    useEffect(() => {
        setCursor(null);
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto max-w-6xl">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Finance</div>
                        <h1 className="text-2xl font-semibold">Refunds</h1>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="h-10 rounded-xl border bg-card px-3 text-sm"
                        >
                            <option value="">Tümü</option>
                            <option value="PENDING">Pending</option>
                            <option value="SUCCEEDED">Succeeded</option>
                            <option value="FAILED">Failed</option>
                        </select>

                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="OrderId / RefundId / ProviderRefundId"
                            className="h-10 w-80 rounded-xl border bg-card px-3 text-sm"
                        />
                        <button
                            onClick={() => {
                                setCursor(null);
                                load(true);
                            }}
                            className="h-10 rounded-xl border bg-card px-4 text-sm font-medium hover:bg-muted/40"
                        >
                            Ara
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-2xl border bg-card shadow-sm overflow-hidden">
                        <div className="grid grid-cols-12 gap-2 border-b bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                            <div className="col-span-3">Refund</div>
                            <div className="col-span-3">Order</div>
                            <div className="col-span-2">Provider</div>
                            <div className="col-span-2">Amount</div>
                            <div className="col-span-2">Status</div>
                        </div>

                        {items.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedId(r.id)}
                                className="w-full text-left grid grid-cols-12 gap-2 px-4 py-3 border-b hover:bg-muted/30"
                            >
                                <div className="col-span-3 text-sm font-medium truncate">{r.id}</div>
                                <div className="col-span-3 text-sm truncate">{r.orderId}</div>
                                <div className="col-span-2 text-sm">{r.provider}</div>
                                <div className="col-span-2 text-sm">{fmt(r.amount, r.currency)}</div>
                                <div className="col-span-2 text-sm text-muted-foreground">
                                    {r.status === "SUCCEEDED" && <span className="text-green-600 font-medium">Başarılı</span>}
                                    {r.status === "FAILED" && <span className="text-destructive font-medium">Başarısız</span>}
                                    {r.status === "PENDING" && <span className="text-amber-500 font-medium">Bekliyor</span>}
                                </div>
                            </button>
                        ))}

                        <div className="p-4 flex justify-end">
                            <button
                                disabled={!cursor || loading}
                                onClick={() => load(false)}
                                className="h-10 rounded-xl border bg-card px-4 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
                            >
                                {loading ? "Yükleniyor…" : cursor ? "Daha Fazla" : "Bitti"}
                            </button>
                        </div>
                    </div>

                    <RefundDetail id={selectedId} />
                </div>
            </div>
        </div>
    );
}

function RefundDetail({ id }: { id: string | null }) {
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            setData(null);
            return;
        }
        (async () => {
            setLoading(true);
            const res = await fetch(`/api/staff/refunds/${encodeURIComponent(id)}`, { cache: "no-store" });
            const json = await res.json().catch(() => null);
            setLoading(false);
            if (res.ok && json?.ok) setData(json.refund);
            else setData(null);
        })();
    }, [id]);

    return (
        <div className="rounded-2xl border bg-card shadow-sm p-5 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <div className="text-sm text-muted-foreground">Refund Detail</div>
            {!id ? (
                <div className="mt-3 text-sm text-muted-foreground">Soldan bir iade işlemi seçiniz.</div>
            ) : loading ? (
                <div className="mt-3 text-sm text-muted-foreground">Yükleniyor…</div>
            ) : !data ? (
                <div className="mt-3 text-sm text-muted-foreground">Bulunamadı.</div>
            ) : (
                <div className="mt-4 space-y-3 text-sm">
                    <Row k="RefundId" v={data.id} />
                    <Row k="OrderId" v={data.orderId} />
                    <Row k="Provider" v={data.provider} />
                    <Row k="Status" v={data.status} />
                    <Row k="Amount" v={fmt(data.amount, data.currency)} />
                    <Row k="ProviderRefundId" v={data.providerRefundId ?? "—"} />
                    <Row k="CreatedAt" v={new Date(data.createdAt).toLocaleString("tr-TR")} />
                    <Row k="UpdatedAt" v={new Date(data.updatedAt).toLocaleString("tr-TR")} />

                    <div className="pt-4 border-t">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">PROVIDER RAW</div>
                        <pre className="max-h-64 overflow-auto rounded-xl border bg-muted/20 p-3 text-xs break-all whitespace-pre-wrap">
                            {JSON.stringify(data.providerResult ?? {}, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

function Row({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="text-muted-foreground w-1/3 shrink-0">{k}</div>
            <div className="font-medium text-right break-words">{v}</div>
        </div>
    );
}

function fmt(v: string, currency: string) {
    const n = Number(v ?? 0);
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: currency || "TRY" }).format(n);
}
