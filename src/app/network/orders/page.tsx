"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { ClipboardList, ArrowRight, Loader2, ChevronRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

// Minimal helper equivalent to 'approvalLabel' and 'isPaid' but using inline modern design
function getStatusConfig(status: string) {
    switch (status) {
        case "PENDING":
        case "AWAITING_PAYMENT":
            return { label: "Ödeme Bekleniyor", color: "text-amber-700 bg-amber-50 border-amber-200", icon: <AlertCircle className="w-3.5 h-3.5" /> }
        case "PAYMENT_FAILED":
            return { label: "Ödeme Başarısız", color: "text-rose-700 bg-rose-50 border-rose-200", icon: <XCircle className="w-3.5 h-3.5" /> }
        case "COMPLETED":
        case "PAID":
            return { label: "Ödendi / Tamamlandı", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> }
        case "CANCELLED":
            return { label: "İptal Edildi", color: "text-slate-600 bg-slate-100 border-slate-200", icon: <XCircle className="w-3.5 h-3.5" /> }
        default:
            return { label: status, color: "text-slate-600 bg-slate-50 border-slate-200", icon: null }
    }
}

function isPaid(status: string) {
    return status === "COMPLETED" || status === "PAID"
}

type Row = {
    id: string
    orderNumber: string
    status: string
    orderDate: string
    totalAmount: number
    currency: "TRY"
}

export default function NetworkOrdersListPage() {
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
        e.stopPropagation()
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
        <div className="font-sans min-h-[calc(100vh-64px)] bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
                
                {/* 1. HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center px-2.5 py-1 mb-3 rounded-md bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                            Trade Geçmişi
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Siparişlerim</h1>
                        <p className="mt-2 text-[15px] text-slate-500 max-w-xl leading-relaxed">
                            B2B ağındaki aktif ve geçmiş tüm siparişlerinizi buradan takip edebilirsiniz.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Link 
                            href={getPath("/network/dashboard")} 
                            className="h-10 px-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Dashboard'a Dön
                        </Link>
                    </div>
                </div>

                {/* Error Banner */}
                {err && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 text-[11px] font-bold">!</span>
                        </div>
                        <div>
                            <div className="font-medium text-rose-800">Hata</div>
                            <div className="text-rose-700">{err}</div>
                        </div>
                    </div>
                )}

                {/* 2. ORDERS LIST */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200/60 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-[14px] font-semibold text-slate-800">Sipariş Listesi</h2>
                        <div className="text-[13px] text-slate-500 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `${items.length} Kayıt`}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <div className="text-[14px] font-medium text-slate-500 tracking-wide">Siparişleriniz Yükleniyor...</div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                <ClipboardList className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Sipariş Bulunamadı</h3>
                            <p className="text-[14px] text-slate-500 max-w-sm">
                                Henüz bu ağda herhangi bir sipariş oluşturmamışsınız. Katalog üzerinden ürün ekleyerek başlayabilirsiniz.
                            </p>
                            <Link 
                                href={getPath("/network/catalog")}
                                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-6 text-[13px] font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                            >
                                Kataloğa Git
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {items.map((o) => {
                                const statusConf = getStatusConfig(o.status)
                                const isOrderPaid = isPaid(o.status)

                                return (
                                    <Link 
                                        key={o.id} 
                                        href={getPath(`/network/orders/${o.id}`)} 
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="font-semibold text-[15px] text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    {o.orderNumber}
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${statusConf.color}`}>
                                                    {statusConf.icon}
                                                    {statusConf.label}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    Tarih: <span className="font-medium text-slate-700">{new Date(o.orderDate).toLocaleString("tr-TR")}</span>
                                                </div>
                                                
                                                {isOrderPaid && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <button
                                                            onClick={(e) => showIntentInfo(e, o.id)}
                                                            className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline flex items-center gap-1"
                                                        >
                                                            Tahsilat Detayı
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-64">
                                            <div className="text-left sm:text-right">
                                                <div className="text-[12px] text-slate-500 mb-0.5">Toplam Tutar</div>
                                                <div className="text-[16px] font-bold text-slate-900">{fmt(o.totalAmount)}</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 text-slate-400 transition-all shadow-sm">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    <div className="p-5 border-t border-slate-100 flex justify-center bg-slate-50/30">
                        {cursor ? (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="h-10 px-6 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {loadingMore && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                {loadingMore ? "Yükleniyor..." : "Daha Fazla Göster"}
                            </button>
                        ) : (
                            <div className="text-[13px] font-medium text-slate-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                                Tüm siparişler listelendi
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Text */}
                <div className="mt-10 text-center pb-8 border-t border-slate-200/50 pt-8">
                    <p className="text-sm font-medium text-slate-500">
                        Periodya B2B — Kurumsal ticaret altyapısı ile işinizi büyütün.
                    </p>
                </div>

            </div>

            {/* INTENT DRAWER / MODAL */}
            {intentDetail && (
                <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-end sm:justify-center p-0 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIntentDetail(null)} />
                    
                    <div className="relative w-full sm:w-full sm:max-w-md h-full sm:h-auto bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-in slide-in-from-right-full sm:slide-in-from-bottom-8 duration-300">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-[16px] font-semibold text-slate-900">Tahsilat Detayı</h2>
                            <button 
                                onClick={() => setIntentDetail(null)} 
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                            {intentDetail.id === "loading" ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <div className="text-[13px] font-medium text-slate-500">Detaylar yükleniyor...</div>
                                </div>
                            ) : intentDetail.error ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 text-center">
                                    {intentDetail.error}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-1">
                                        <div className="text-[12px] font-medium text-slate-500">Ödeme Durumu</div>
                                        <div className="text-[15px] font-semibold text-emerald-700 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {intentDetail.status}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-1">
                                        <div className="text-[12px] font-medium text-slate-500">Ödeme Sağlayıcı</div>
                                        <div className="text-[14px] font-semibold text-slate-900">{intentDetail.provider}</div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-1">
                                        <div className="text-[12px] font-medium text-slate-500">Referans Kodu</div>
                                        <div className="text-[14px] font-mono font-medium text-slate-700 truncate" title={intentDetail.referenceCode}>
                                            {intentDetail.referenceCode || "—"}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-1">
                                        <div className="text-[12px] font-medium text-slate-500">Ödenen Tutar</div>
                                        <div className="text-[16px] font-bold text-slate-900 tracking-tight">
                                            {intentDetail.paidAmount ? fmt(Number(intentDetail.paidAmount)) : "—"}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-1">
                                        <div className="text-[12px] font-medium text-slate-500">İşlem Tarihi</div>
                                        <div className="text-[14px] font-medium text-slate-900">
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
