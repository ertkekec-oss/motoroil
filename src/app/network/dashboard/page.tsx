"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { Wallet, Landmark, Activity, LayoutGrid, ShoppingCart, ClipboardList, ArrowRight } from "lucide-react"

type Me = {
    dealerCompanyName: string | null
    supplierName: string
    creditLimit: number
    balance: number
    currency: "TRY"
    supplierEmail?: string | null
    supplierPhone?: string | null
    supplierAddress?: string | null
    supplierCity?: string | null
    supplierDistrict?: string | null
    supplierVkn?: string | null
    supplierTaxOffice?: string | null
}

export default function NetworkDashboardPage() {
    const getPath = useNetworkPath()
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
        <div className="font-sans">
            <div className="mx-auto w-full max-w-7xl px-6 py-10 space-y-8">
                
                {/* Error Banner */}
                {err && (
                    <div className="rounded-xl border border-rose-200/60 bg-rose-50 p-4 text-sm flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 text-[11px] font-bold">!</span>
                        </div>
                        <div>
                            <div className="font-medium text-rose-800">Sistem Hatası</div>
                            <div className="text-rose-700 leading-relaxed mt-0.5">{err}</div>
                        </div>
                    </div>
                )}

                {/* 1. HERO / COMPANY CONTEXT CARD */}
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 overflow-hidden">
                    {/* Subtle Abstract Pattern Background */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white/0 to-white/0 pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex-1">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                            Periodya Dealer Network
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2" title={me?.supplierName ?? ""}>
                            {me?.supplierName ? (me.supplierName.length > 20 ? me.supplierName.substring(0, 20) + '...' : me.supplierName) : "..."}
                        </h1>

                        <div className="mt-4 flex flex-wrap items-center gap-y-3 px-4 py-3 bg-slate-50/80 border border-slate-100 rounded-xl text-[13px] text-slate-600 font-medium w-fit max-w-full">
                           {/* Supplier Email */}
                           <div className="flex items-center gap-2 pr-4 border-r border-slate-200/80">
                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                               <span className="truncate max-w-[150px] sm:max-w-none">{me?.supplierEmail || 'E-posta belirtilmedi'}</span>
                           </div>

                           {/* Supplier Phone */}
                           <div className="flex items-center gap-2 pl-4 pr-4 border-r border-slate-200/80 shrink-0">
                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                               <span className="tracking-wide">{me?.supplierPhone || 'Telefon belirtilmedi'}</span>
                           </div>

                           {/* Supplier VKN */}
                           <div className="flex items-center gap-2 pl-4 pr-4 border-r border-slate-200/80 shrink-0">
                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                               <span>
                                   VD: <strong className="text-slate-700">{me?.supplierTaxOffice || '-'}</strong> / VKN: <strong className="text-slate-700">{me?.supplierVkn || '-'}</strong>
                               </span>
                           </div>

                            {/* Dealer Company Name */}
                           <div className="flex items-center gap-2 pl-4 shrink-0 text-blue-700 bg-blue-50 -my-3 py-3 -mr-4 pr-4 rounded-r-xl border-l border-blue-100">
                               <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse"></span>
                               <span>Cari: <strong className="font-bold text-blue-800">{me?.dealerCompanyName || "Yükleniyor..."}</strong></span>
                           </div>
                        </div>
                    </div>

                    <div className="relative z-10 shrink-0">
                        <Link
                            href={getPath("/network/select-supplier")}
                            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm active:scale-[0.98]"
                        >
                            Tedarikçi Değiştir
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                    </div>
                </div>

                {/* 2. KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* KPI 1 */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-transparent group-hover:from-blue-500/40 transition-colors" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <Wallet className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="text-[13px] font-medium text-slate-500 mb-1">Kredi Limiti</div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">
                            {loading ? "..." : formatMoney(me?.creditLimit ?? 0, me?.currency ?? "TRY")}
                        </div>
                        <div className="mt-3 text-[13px] text-slate-500">
                            Kullanılabilir Limit: <span className="font-semibold text-slate-700">{loading ? "..." : formatMoney(me?.creditLimit ?? 0, me?.currency ?? "TRY")}</span>
                        </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 to-transparent group-hover:from-emerald-500/40 transition-colors" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <Landmark className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="text-[13px] font-medium text-slate-500 mb-1">Bakiye</div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">
                            {loading ? "..." : formatMoney(me?.balance ?? 0, me?.currency ?? "TRY")}
                        </div>
                        <div className="mt-3 text-[13px] text-slate-500">
                            Toplam Bakiye
                        </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/20 to-transparent group-hover:from-amber-500/40 transition-colors" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <Activity className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="text-[13px] font-medium text-slate-500 mb-1">Kullanım</div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">
                            {loading ? "..." : percentUsage(me?.balance ?? 0, me?.creditLimit ?? 0)}
                        </div>
                        <div className="mt-3 text-[13px] text-slate-500">
                            Aktif kullanım {loading ? "..." : percentUsage(me?.balance ?? 0, me?.creditLimit ?? 0) === "—" ? "yok" : "oranı"}
                        </div>
                    </div>
                </div>

                {/* 3. QUICK ACTIONS */}
                <div>
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Hızlı İşlemler</h2>
                        <p className="text-[14px] text-slate-500 mt-1">
                            Kataloğu görüntüle, ürünleri incele ve siparişlerini yönet.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Action 1 */}
                        <Link 
                            href={getPath("/network/catalog")}
                            className="group flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.01)] hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                                    <LayoutGrid className="w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-0.5">Kataloğa Git</h3>
                                    <p className="text-[13px] text-slate-500">Ürünleri görüntüle ve incele</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 ml-4">
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                            </div>
                        </Link>

                        {/* Action 2 */}
                        <Link 
                            href={getPath("/network/cart")}
                            className="group flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.01)] hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                                    <ShoppingCart className="w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-0.5">Sepete Git</h3>
                                    <p className="text-[13px] text-slate-500">Ürün ekle ve sipariş oluştur</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 ml-4">
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                            </div>
                        </Link>

                        {/* Action 3 */}
                        <Link 
                            href={getPath("/network/orders")}
                            className="group flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.01)] hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                                    <ClipboardList className="w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-0.5">Siparişlerim</h3>
                                    <p className="text-[13px] text-slate-500">Mevcut siparişleri görüntüle</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 ml-4">
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="mt-14 text-center pb-8 border-t border-slate-200/50 pt-8">
                    <p className="text-sm font-medium text-slate-500">
                        Periodya B2B — Kurumsal ticaret altyapısı ile işinizi büyütün.
                    </p>
                </div>

            </div>
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
