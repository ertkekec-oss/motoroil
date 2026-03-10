"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { Building2, CreditCard, LogOut, ArrowRightLeft, UserCircle2, Loader2, Landmark, Wallet } from "lucide-react"

export default function NetworkAccountPage() {
    const getPath = useNetworkPath()
    const router = useRouter()
    const [me, setMe] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ; (async () => {
            const res = await fetch("/api/network/me")
            const data = await res.json().catch(() => null)
            if (res.ok && data?.ok) {
                setMe(data.me)
            }
            setLoading(false)
        })()
    }, [])

    const handleLogout = async () => {
        await fetch("/api/network/auth/logout", { method: "POST" })
        router.push(getPath("/network/login"))
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <div className="text-[14px] font-medium text-slate-500 tracking-wide">Hesap Bilgileri Yükleniyor...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="font-sans min-h-[calc(100vh-64px)] bg-slate-50">
            <div className="mx-auto w-full max-w-4xl px-6 py-10 space-y-8">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center px-2.5 py-1 mb-3 rounded-md bg-transparent border border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Profil & Ayarlar
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Hesabım</h1>
                        <p className="mt-2 text-[15px] text-slate-500 max-w-xl leading-relaxed">
                            Ağ içindeki bağlandığınız tedarikçilere ait hesap bilgilerinizi yönetin.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: IDENTIFICATION OR OVERVIEW */}
                    <div className="md:col-span-1 flex flex-col gap-6">
                        
                        {/* Profile Info Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                                <UserCircle2 className="w-10 h-10" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                {me?.dealerCompanyName || "Cari İsim Yok"}
                            </h2>
                            <p className="text-[13px] font-medium text-slate-500 mt-1">Bayi Hesabı</p>
                            
                            <div className="w-full border-t border-slate-100 mt-6 pt-6 flex flex-col gap-3">
                                <Link
                                    href={getPath("/network/select-supplier")}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                                >
                                    <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                                    Tedarikçi Değiştir
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-rose-50 hover:bg-rose-100 px-4 py-2.5 text-[13px] font-semibold text-rose-700 transition-all active:scale-[0.98]"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Güvenli Çıkış Yap
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ACTIVE SUPPLIER DETAILS */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Session Context */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                    <Building2 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-semibold text-slate-900">Aktif Tedarikçi Bağlantısı</h3>
                                    <p className="text-[13px] text-slate-500 mt-0.5">Şu an işlem yaptığınız tedarikçi ve size tanımlanan koşullar.</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="flex flex-col gap-1.5">
                                        <dt className="text-[12px] font-medium text-slate-500">Tedarikçi Firma</dt>
                                        <dd className="text-[15px] font-semibold text-slate-900 border-b border-slate-100 pb-2">
                                            {me?.supplierName || "Bilinmiyor"}
                                        </dd>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <dt className="text-[12px] font-medium text-slate-500">Bayi Adınız (Bağlantı)</dt>
                                        <dd className="text-[15px] font-medium text-slate-800 border-b border-slate-100 pb-2 truncate" title={me?.dealerCompanyName}>
                                            {me?.dealerCompanyName || "-"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Financials Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50/50 to-transparent rounded-bl-full pointer-events-none" />
                                <div className="flex items-center gap-4 mb-4">
                                     <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                        <Wallet className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div className="text-[13px] font-medium text-slate-500">Kredi Limitiniz</div>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: me?.currency || "TRY" }).format(me?.creditLimit || 0)}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/50 to-transparent rounded-bl-full pointer-events-none" />
                                <div className="flex items-center gap-4 mb-4">
                                     <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                                        <Landmark className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div className="text-[13px] font-medium text-slate-500">Güncel Bakiyeniz</div>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: me?.currency || "TRY" }).format(me?.balance || 0)}
                                </div>
                            </div>

                        </div>
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
