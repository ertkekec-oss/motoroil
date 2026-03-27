"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { ShoppingCart, Package, CreditCard, ChevronRight, Activity, TrendingUp, AlertCircle, FileText, MapPin } from "lucide-react"

type Me = {
    dealerCompanyName: string | null
    supplierName: string
    creditLimit: number
    balance: number
    points: number
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

    const availableLimit = Math.max(0, (me?.creditLimit || 0) - (me?.balance || 0));
    const usagePercent = percentUsage(me?.balance ?? 0, me?.creditLimit ?? 0);

    return (
        <div className="font-sans min-h-screen bg-slate-50 pb-16 w-full">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                
                {err && (
                    <div className="rounded-xl border border-rose-200/60 bg-rose-50 p-4 text-sm flex items-start gap-3 mb-6">
                        <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 text-[11px] font-bold">!</span>
                        </div>
                        <div>
                            <div className="font-medium text-rose-800">Sistem Hatası</div>
                            <div className="text-rose-700 leading-relaxed mt-0.5">{err}</div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <div className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] uppercase tracking-widest mb-3">
                            Periodya Dealer Network
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            {me?.supplierName ? (me.supplierName.length > 25 ? me.supplierName.substring(0, 25) + '...' : me.supplierName) : "B2B Bayi Portalı"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            Alıcı cari özetiniz, aktif teslimatlarınız ve toptan sipariş işlemleriniz.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <Link 
                            href={getPath("/network/select-supplier")}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Tedarikçi Değiştir
                        </Link>
                        <Link 
                            href={getPath("/network/catalog")}
                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            Kataloğa Git
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Kredi Limiti */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                        <div className="flex items-center justify-between mb-4 relative">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kredi Limiti</h3>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <CreditCard className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-mono font-bold text-slate-900 mb-1 relative">
                            {loading ? "..." : formatMoney(me?.creditLimit ?? 0, me?.currency ?? "TRY")}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-semibold mt-2">
                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                Açık Hesap (B2B)
                            </span>
                        </div>
                    </div>

                    {/* Bakiye */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-rose-500/20 transition-colors"></div>
                        <div className="flex items-center justify-between mb-4 relative">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Açık Bakiye (Borç)</h3>
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-1 relative">
                            <p className="text-2xl font-mono font-bold text-rose-600">
                                {loading ? "..." : formatMoney(me?.balance ?? 0, me?.currency ?? "TRY")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold mt-2">
                            <span className="text-slate-500 px-1.5 py-0.5 rounded outline outline-1 outline-slate-200">
                                Toplam bekleyen bakiye
                            </span>
                        </div>
                    </div>

                    {/* Limit Kullanımı */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 relative">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kredi Kullanımı</h3>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-mono font-bold text-slate-900 mb-1 relative">
                            {loading ? "..." : usagePercent !== "—" ? `${usagePercent}` : "Yok"}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-semibold mt-2">
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded outline outline-1 outline-emerald-200">
                                {loading ? "..." : formatMoney(availableLimit, me?.currency ?? "TRY")} kullanılabilir
                            </span>
                        </div>
                    </div>

                    {/* Parapuan */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-amber-500/20 transition-colors"></div>
                        <div className="flex items-center justify-between mb-4 relative">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kazanılan B2B Puan</h3>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-mono font-bold text-slate-900 mb-1 relative">
                            {loading ? "..." : formatMoney(me?.points ?? 0, "TRY")}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-semibold mt-2">
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                Bekleyen Puan Bakiyesi
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Grid area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Açık Siparişler */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-indigo-500" />
                                    Aktif Sipariş / Sevkiyatlar
                                </h2>
                                <Link href={getPath("/network/orders")} className="text-xs font-bold text-indigo-600 hover:underline">
                                    Tümünü Gör
                                </Link>
                            </div>
                        </div>
                        <div className="p-0 flex-1">
                            {loading ? (
                                <div className="p-12 text-center text-slate-500 text-sm font-semibold">Sipariş verileri yükleniyor...</div>
                            ) : (
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50/80 text-xs text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Sipariş No</th>
                                            <th className="px-6 py-4">Tarih</th>
                                            <th className="px-6 py-4 text-right">Tutar</th>
                                            <th className="px-6 py-4 text-center">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* Mock Data (Can be replaced with real orders later) */}
                                        <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-5 font-mono font-bold text-indigo-600">
                                                B2B-{new Date().getFullYear()}-0014
                                            </td>
                                            <td className="px-6 py-5 text-slate-700">
                                                Bugün, 11:30
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono font-bold text-slate-900">
                                                12.450,00 ₺
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <span className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1.5 shadow-sm">
                                                        <MapPin className="w-3 h-3" /> YOLDA
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-5 font-mono font-bold text-indigo-600">
                                                B2B-{new Date().getFullYear()}-0011
                                            </td>
                                            <td className="px-6 py-5 text-slate-700">
                                                Dün, 16:45
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono font-bold text-slate-900">
                                                4.200,00 ₺
                                            </td>
                                            <td className="px-6 py-5 flex justify-center">
                                                <span className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 rounded-md shadow-sm">
                                                    HAZIRLANIYOR
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Fatura & Cari */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                Hızlı İşlemler & Cari
                            </h2>
                        </div>
                        <div className="p-6 flex-1 flex flex-col gap-4">
                            
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Açık Cari Kaydınız</span>
                                <span className="font-bold text-blue-700 text-lg">{me?.dealerCompanyName || "Cari Yükleniyor"}</span>
                            </div>

                            <Link href={getPath("/network/cart")} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-slate-900">Aktif Sepetiniz</p>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Sipariş oluşturun</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link href={getPath("/network/orders")} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-slate-900">Geçmiş Siparişler</p>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Teslimatları takip edin</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <button className="w-full py-3 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-sm hover:translate-y-[-1px] hover:shadow-md active:translate-y-[1px] transition-all">
                                    Tüm Faturaları Gör
                                </button>
                            </div>
                        </div>
                    </div>

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
