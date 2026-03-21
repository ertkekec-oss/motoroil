"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { Building2, LogOut, ArrowRightLeft, UserCircle2, Loader2, Landmark, Wallet, Layers, Banknote, ShieldCheck } from "lucide-react"

export default function NetworkAccountPage() {
    const getPath = useNetworkPath()
    const router = useRouter()
    const [me, setMe] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("profile")

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
            <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center px-2.5 py-1 mb-3 rounded-md bg-transparent border border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Yönetim Merkezi
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Hesap ve Finans</h1>
                        <p className="mt-2 text-[15px] text-slate-500 max-w-xl leading-relaxed">
                            Ağ içindeki bağlandığınız tedarikçilere ait profilinizi yönetin, limit ve bakiye durumlarınızı inceleyin.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    
                    {/* LEFT COLUMN: TABS */}
                    <div className="md:col-span-1 flex flex-col gap-2">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[14px] font-semibold transition-all ${
                                activeTab === 'profile' 
                                    ? 'bg-white shadow-sm border border-slate-200 text-blue-600' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent cursor-pointer'
                            }`}
                        >
                            <UserCircle2 className={`w-5 h-5 ${activeTab==='profile'?'text-blue-500':'text-slate-400'}`} />
                            Profilim
                        </button>

                        <button 
                            onClick={() => setActiveTab('finances')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[14px] font-semibold transition-all ${
                                activeTab === 'finances' 
                                    ? 'bg-white shadow-sm border border-slate-200 text-blue-600' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent cursor-pointer'
                            }`}
                        >
                            <Wallet className={`w-5 h-5 ${activeTab==='finances'?'text-blue-500':'text-slate-400'}`} />
                            Hesabım (Finans)
                        </button>
                    </div>

                    {/* RIGHT COLUMN: CONTENT */}
                    <div className="md:col-span-3">
                        {activeTab === 'profile' && <ProfileTab me={me} handleLogout={handleLogout} getPath={getPath} />}
                        {activeTab === 'finances' && <FinancesTab me={me} />}
                    </div>

                </div>

            </div>
        </div>
    )
}

function ProfileTab({ me, handleLogout, getPath }: { me: any, handleLogout: () => void, getPath: (s:string) => string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
             {/* Profile Info Card */}
             <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                        <UserCircle2 className="w-10 h-10" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        {me?.dealerCompanyName || "Cari İsim Yok"}
                    </h2>
                    <p className="text-[13px] font-medium text-slate-500 mt-1">B2B Bayi Hesabı</p>
                    
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

             {/* Supplier Info Context */}
             <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
                        <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-semibold text-slate-900">Aktif Tedarikçi Bağlantısı</h3>
                                <p className="text-[13px] text-slate-500 mt-0.5">Şu an işlem yaptığınız tedarikçi ve koşullar.</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <dl className="grid grid-cols-1 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <dt className="text-[12px] font-medium text-slate-500">Tedarikçi Firma</dt>
                                    <dd className="text-[15px] font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        {me?.supplierName || "Bilinmiyor"}
                                    </dd>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <dt className="text-[12px] font-medium text-slate-500">Bayi Adınız (Cari Unvanı)</dt>
                                    <dd className="text-[15px] font-medium text-slate-800 border-b border-slate-100 pb-2 truncate" title={me?.dealerCompanyName}>
                                        {me?.dealerCompanyName || "-"}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
             </div>
        </div>
    )
}

function FinancesTab({ me }: { me: any }) {
    const [subTab, setSubTab] = useState("invoices")
    const [finances, setFinances] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ;(async () => {
            const res = await fetch("/api/network/finances")
            const data = await res.json().catch(() => null)
            if (data?.ok) {
                setFinances(data)
            }
            setLoading(false)
        })()
    }, [])

    const fmt = (val: number | undefined) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: me?.currency || "TRY" }).format(val || 0)
    const curCred = Math.max(0, (me?.creditLimit || 0) - Math.max(0, me?.balance || 0) - (me?.exposureBase || 0))

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Top Fixed Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Credit Limits Box */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50/50 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="text-[14px] font-semibold text-slate-700 flex items-center gap-2">
                             <Wallet className="w-4 h-4 text-blue-500" /> Kredi Limiti & Kullanım
                        </div>
                    </div>
                    <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                            <span className="text-[13px] font-medium text-slate-500">Güncel Kredi (Kullanılabilir)</span>
                            <span className="text-xl font-bold text-blue-600 tracking-tight">{fmt(curCred)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-medium text-slate-400">Toplam Tanımlı Limit</span>
                            <span className="text-[14px] font-semibold text-slate-700">{fmt(me?.creditLimit)}</span>
                        </div>
                    </div>
                </div>

                {/* Debt/Receivable Box */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-50/50 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-6 gap-4 relative z-10">
                        <div className="text-[14px] font-semibold text-slate-700 flex items-center gap-2">
                             <Landmark className="w-4 h-4 text-rose-500" /> Cari Hesap Özeti (Borç)
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm tracking-wide flex items-center justify-center gap-2 active:scale-95 shrink-0">
                            <Banknote className="w-4 h-4" /> Ödeme Yap
                        </button>
                    </div>
                    <div className="space-y-3 relative z-10 mt-auto">
                        <div className="flex justify-between items-end">
                            <span className="text-[13px] font-medium text-slate-500">Güncel Borç (Açık Bakiye)</span>
                            <span className={`text-2xl font-bold tracking-tight ${me?.balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{fmt(Math.max(0, me?.balance))}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inner Tabs: Satış ve Faturalar | Finansal İşlemler */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden min-h-[400px] flex flex-col">
                <div className="flex items-center border-b border-slate-100 px-2 sm:px-4 pt-4 gap-2 sm:gap-6 overflow-x-auto custom-scroll bg-slate-50/30">
                    <button onClick={() => setSubTab('invoices')} className={`pb-3 px-3 text-[14px] font-semibold border-b-[2.5px] transition-all whitespace-nowrap ${subTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Satış ve Faturalar</button>
                    <button onClick={() => setSubTab('transactions')} className={`pb-3 px-3 text-[14px] font-semibold border-b-[2.5px] transition-all whitespace-nowrap ${subTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Finansal İşlemler</button>
                </div>
                
                <div className="flex-1 p-6 relative">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-pulse">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                            <h3 className="text-[14px] font-medium text-slate-500">Finansal Veriler Yükleniyor...</h3>
                        </div>
                    )}

                    {!loading && subTab === 'invoices' && (
                        <div className="animate-in fade-in duration-300">
                            {(!finances?.invoices || finances.invoices.length === 0) && (!finances?.orders || finances.orders.length === 0) ? (
                                <div className="flex flex-col items-center justify-center text-center p-12">
                                     <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                        <Layers className="w-8 h-8" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Faturalar Yakında Geliyor...</h3>
                                    <div className="text-slate-500 text-[14px] max-w-sm leading-relaxed">Bağlı olduğunuz tedarikçi tarafından kesilmiş güncel fatura ve satış kalemlerinizin detayları çok yakında bu alanda listelenecek.</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Satışlar ve Faturalar ({finances?.invoices?.length + finances?.orders?.length})</h4>
                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                        {[...(finances?.invoices || []), ...(finances?.orders || [])]
                                            .sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((item: any) => (
                                            <InvoiceRow key={item.id} item={item} fmt={fmt} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && subTab === 'transactions' && (
                        <div className="animate-in fade-in duration-300">
                             {!finances?.transactions || finances.transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center p-12">
                                     <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                        <ArrowRightLeft className="w-8 h-8" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Hesap Hareketleri Yakında</h3>
                                    <div className="text-slate-500 text-[14px] max-w-sm leading-relaxed">Tüm tahsilat, havale ve kredi kartı ödemelerinizin finansal dökümü yakında bu menüde detaylandırılacaktır.</div>
                                </div>
                             ) : (
                                <div className="space-y-4">
                                     <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mali İşlem Geçmişi ({finances.transactions.length})</h4>
                                     <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                        {finances.transactions.map((tx: any) => {
                                            const isCollection = ["income", "Collection", "Senet", "Check"].includes(tx.type);
                                            const isPayment = tx.type === "Payment";
                                            return (
                                                <div key={tx.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[14px] font-semibold text-slate-900">{tx.desc || tx.type}</span>
                                                        <span className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('tr-TR')} • REF: {tx.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-[15px] font-bold ${isCollection ? 'text-emerald-600' : isPayment ? 'text-blue-600' : 'text-rose-600'}`}>
                                                            {isCollection ? '+' : ''}{fmt(Math.abs(tx.amount))}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${isCollection ? 'bg-emerald-50 text-emerald-600' : isPayment ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {isCollection ? 'Tahsilat' : isPayment ? 'S. Ödemesi' : 'Borç Dekontu'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                     </div>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function InvoiceRow({ item, fmt }: { item: any, fmt: any }) {
    const [expanded, setExpanded] = useState(false)
    const canPrint = item.isFormal || (item.status && item.isFormal !== undefined); // SalesInvoice

    return (
        <div className="flex flex-col">
            <div 
                onClick={() => setExpanded(!expanded)}
                className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors cursor-pointer group"
            >
                <div className="flex flex-col gap-1">
                    <span className="text-[14px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                        {expanded ? '▼' : '▶'} {item.no || "No'suz İşlem"}
                    </span>
                    <span className="text-xs text-slate-500 ml-5">{new Date(item.date).toLocaleDateString('tr-TR')} • {item.isFormal !== undefined ? (item.isFormal ? 'Resmi E-Fatura' : 'Taslak Fatura') : 'B2B Siparişi'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-[15px] font-bold ${item.isFormal !== undefined ? 'text-indigo-600' : 'text-emerald-600'}`}>{fmt(item.amount)}</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 text-slate-500 bg-slate-100 rounded-md">
                            {item.status || "Tamamlandı"}
                        </span>
                    </div>
                </div>
            </div>
            
            {expanded && (
                <div className="p-4 bg-slate-100/50 border-t border-slate-100 border-b border-b-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">İşlem Kalemleri</h5>
                        {canPrint && (
                            <a 
                                href={`/api/sales/invoices?action=get-pdf&invoiceId=${item.id}`} 
                                target="_blank" 
                                className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:border-slate-300 hover:text-blue-600 hover:shadow-sm transition-all flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span>📄</span> PDF İncele / Yazdır
                            </a>
                        )}
                    </div>
                    <div className="space-y-2">
                        {item.items && item.items.length > 0 ? (
                            item.items.map((sub: any, idx: number) => (
                                <div key={idx} className="bg-white border border-slate-200/60 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-medium text-slate-800">{sub.name || sub.productName || "Ürün Girişi"}</span>
                                            <span className="text-[11px] text-slate-500">{sub.qty || sub.quantity} Adet x {fmt(sub.price)}</span>
                                        </div>
                                    </div>
                                    <div className="text-[13px] font-bold text-slate-700">
                                        {fmt((sub.qty || sub.quantity) * (sub.price || 0))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-slate-500 py-2">Kalem detayı bulunmuyor.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
