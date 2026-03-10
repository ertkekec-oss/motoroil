"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNetworkPath } from "@/hooks/useNetworkPath"

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

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>

    return (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Hesabım</h1>

            <div className="bg-white shadow sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-slate-900">Mevcut Aktif Üyelik</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">Şu anda işlem yaptığınız tedarikçi ve limit bilgileriniz.</p>
                </div>
                <div className="border-t border-slate-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-slate-200">
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Tedarikçi Firma</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 font-semibold">{me?.supplierName || "Bilinmiyor"}</dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Bayi Adınız</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">{me?.dealerCompanyName || "-"}</dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Kredi Limitiniz</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: me?.currency || "TRY" }).format(me?.creditLimit || 0)}
                            </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Mevcut Bakiyeniz</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
                                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: me?.currency || "TRY" }).format(me?.balance || 0)}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <Link
                    href={getPath("/network/select-supplier")}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    Farklı Bir Tedarikçiye Geç
                </Link>

                <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                    Güvenli Çıkış Yap
                </button>
            </div>
        </div>
    )
}
