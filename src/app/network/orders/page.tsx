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
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [statusFilter, setStatusFilter] = useState("all")
    const [totalCount, setTotalCount] = useState(0)

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

    async function loadData() {
        setLoading(true); setErr(null)
        const res = await fetch(`/api/network/orders?page=${page}&status=${statusFilter}`, { cache: "no-store" })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) { setErr("Siparişler alınamadı."); setLoading(false); return }
        setItems(data.items || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.totalCount || 0)
        setLoading(false)
    }

    useEffect(() => { loadData() }, [page, statusFilter])

    return (
        <div className="font-sans min-h-[calc(100vh-64px)] bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
                
                {/* 1. HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            Siparişlerim
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                                Trade Geçmişi
                            </span>
                        </h1>
                        <p className="mt-1.5 text-[14px] text-slate-500 leading-relaxed font-medium">
                            B2B ağındaki aktif ve geçmiş tüm siparişlerinizi ve ödemelerinizi buradan takip edebilirsiniz.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Link 
                            href={getPath("/network/dashboard")} 
                            className="h-9 px-4 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-[0_1px_2px_rgb(0,0,0,0.05)]"
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

                {/* 2. FILTERS */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scroll">
                    {[
                        { id: 'all', label: 'Tüm Siparişler' },
                        { id: 'PENDING', label: 'Bekleyenler' },
                        { id: 'AWAITING_PAYMENT', label: 'Ödeme Bekleyen' },
                        { id: 'COMPLETED', label: 'Onaylandı / Tamamlandı' },
                        { id: 'CANCELLED', label: 'İptal Edildi' }
                    ].map(f => (
                        <button 
                            key={f.id} 
                            onClick={() => { setPage(1); setStatusFilter(f.id); }}
                            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${statusFilter === f.id ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* 3. ORDERS LIST */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Sipariş Listesi</h2>
                        <div className="text-[13px] text-slate-500 font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `${totalCount} Kayıt`}
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
                            <h3 className="text-[15px] font-bold text-slate-900 mb-1">Kayıt Bulunamadı</h3>
                            <p className="text-[14px] text-slate-500 max-w-sm">
                                Seçili filtreye uygun veya mevcut ağda herhangi bir sipariş bulunmuyor.
                            </p>
                            {statusFilter === 'all' && (
                                <Link 
                                    href={getPath("/network/catalog")}
                                    className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-6 text-[13px] font-bold text-white transition hover:bg-blue-700 shadow-sm"
                                >
                                    Kataloğa Git
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col min-w-[700px] overflow-x-auto divide-y divide-slate-100">
                            {items.map((o) => {
                                const statusConf = getStatusConfig(o.status)
                                const isOrderPaid = isPaid(o.status)

                                return (
                                    <Link 
                                        key={o.id} 
                                        href={getPath(`/network/orders/${o.id}`)} 
                                        className="group grid grid-cols-12 items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <div className="col-span-3 lg:col-span-3 flex flex-col gap-1.5">
                                            <div className="font-bold text-[14px] text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {o.orderNumber}
                                            </div>
                                            <div className="text-[12px] font-medium text-slate-500">
                                                {new Date(o.orderDate).toLocaleString("tr-TR")}
                                            </div>
                                        </div>

                                        <div className="col-span-4 lg:col-span-4 flex flex-col items-start gap-1">
                                            <div className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1.5 ${statusConf.color}`}>
                                                {statusConf.icon}
                                                {statusConf.label}
                                            </div>
                                            {isOrderPaid && (
                                                <button
                                                    onClick={(e) => showIntentInfo(e, o.id)}
                                                    className="text-emerald-600 text-[11px] bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100 hover:bg-emerald-100 font-bold transition-colors flex items-center gap-1 mt-1"
                                                >
                                                    Tahsilat Detayı İncele
                                                </button>
                                            )}
                                        </div>

                                        <div className="col-span-4 lg:col-span-4 text-right flex flex-col gap-0.5">
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Toplam Tutar</div>
                                            <div className="text-[16px] font-black text-slate-800 tracking-tight">{fmt(o.totalAmount)}</div>
                                        </div>

                                        <div className="col-span-1 flex justify-end">
                                            <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* PAGINATION ROW */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-[13px] font-medium text-slate-500">Sayfa {page} / {totalPages}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Önceki
                                </button>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Sonraki
                                </button>
                            </div>
                        </div>
                    )}
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
