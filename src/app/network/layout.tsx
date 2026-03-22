"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { ShoppingCart, UserCircle2, X, ChevronRight, PackageOpen, Loader2 } from "lucide-react"

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const getPath = useNetworkPath()

    // Setup mounted state to avoid hydration mismatch on dynamic links
    const [mounted, setMounted] = useState(false)
    const [cartData, setCartData] = useState<any>(null)
    const [showCartFlyout, setShowCartFlyout] = useState(false)
    
    const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v)

    const loadCart = async () => {
        try {
            const res = await fetch("/api/network/cart", { cache: "no-store" })
            const data = await res.json()
            if (data.ok) setCartData(data.cart)
        } catch (e) {}
    }

    // Public sayfalar için minimal topbar veya gizli
    const isPublic = pathname === "/network/login" || pathname === "/login" || pathname === "/" || pathname.startsWith("/network/invite") || pathname.startsWith("/invite");

    useEffect(() => {
        setMounted(true)
        if (!isPublic) {
            loadCart()
            const handleUpdate = () => loadCart()
            window.addEventListener("cart_update", handleUpdate)
            return () => window.removeEventListener("cart_update", handleUpdate)
        }
    }, [isPublic])

    if (isPublic) {
        return <>{children}</>
    }

    if (!mounted) {
        return <div className="min-h-screen bg-slate-50"></div>
    }

    const navs = [
        { path: getPath("/network/dashboard"), label: "Dashboard" },
        { path: getPath("/network/catalog"), label: "Katalog" },
        { path: getPath("/network/orders"), label: "Siparişlerim" },
        { path: getPath("/network/account"), label: "Hesabım" },
    ]

    const cartSummary = cartData?.summary
    const cartItems = cartData?.items || []

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Premium Top Navigation */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-16 shadow-sm">
                <div className="mx-auto max-w-7xl px-6 h-full flex items-center justify-between relative">
                    
                    {/* Left: Brand */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-lg select-none">P</span>
                        </div>
                        <Link href={getPath("/network/dashboard")} className="text-[17px] font-semibold tracking-tight text-slate-900 hidden sm:block">
                            B2B Portal
                        </Link>
                    </div>

                    {/* Middle: Navigation */}
                    <nav className="absolute left-1/2 -translate-x-1/2 h-full hidden md:flex items-center space-x-6">
                        {navs.map((nav) => {
                            const isDashboard = nav.path === getPath("/network/dashboard")
                            const active = isDashboard ? pathname === nav.path : pathname.startsWith(`${nav.path}`)
                            return (
                                <Link
                                    key={nav.path}
                                    href={nav.path}
                                    className={`relative flex items-center h-full px-1 text-[14px] font-medium transition-colors ${
                                        active
                                            ? "text-blue-600"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    {nav.label}
                                    {active && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-5">
                        
                        {cartSummary && cartSummary.freeShippingThreshold > 0 && cartSummary.grandTotal < cartSummary.freeShippingThreshold && (
                            <div className="hidden lg:flex items-center mx-2 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm shadow-amber-500/5">
                                    {fmt(cartSummary.freeShippingThreshold - cartSummary.grandTotal + cartSummary.shippingFee)} ekleyin, kargo BEDAVA!
                                </div>
                            </div>
                        )}

                        {/* FLYOUT TRIGGER */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setShowCartFlyout(true)}
                            onMouseLeave={() => setShowCartFlyout(false)}
                        >
                            <Link 
                                href={getPath("/network/cart")} 
                                className={`relative flex items-center p-2 rounded-xl transition-all ${showCartFlyout ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
                            >
                                <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center bg-blue-600 text-white text-[10px] font-black rounded-full border-2 border-white shadow-sm ring-1 ring-blue-100">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>

                            {/* PREMIUM FLYOUT COMPONENT */}
                            <div className={`absolute top-full right-0 mt-1 w-[380px] bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] origin-top-right transition-all duration-300 z-[100] ${showCartFlyout ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">Sepetim</span>
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartItems.length} Kalem</span>
                                    </div>
                                    <Link href={getPath("/network/cart")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group">
                                        Tümünü Gör <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>

                                <div className="max-h-[360px] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
                                    {cartItems.length === 0 ? (
                                        <div className="p-12 flex flex-col items-center justify-center text-center opacity-60">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                                                <PackageOpen className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500">Sepetiniz şu an boş</p>
                                        </div>
                                    ) : (
                                        cartItems.map((it: any) => (
                                            <div key={it.id} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 group">
                                                <div className="w-14 h-14 bg-white border border-slate-100 rounded-xl flex-shrink-0 p-1 flex items-center justify-center shadow-sm">
                                                    {it.imageUrl ? (
                                                        <img src={it.imageUrl} alt={it.name} className="w-full h-full object-contain mix-blend-multiply" />
                                                    ) : (
                                                        <PackageOpen className="w-6 h-6 text-slate-200" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13px] font-bold text-slate-800 truncate mb-1" title={it.name}>{it.name}</div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-slate-400">{it.quantity} x {fmt(it.effectivePrice)}</span>
                                                        <span className="text-[13px] font-black text-slate-900 tracking-tight">{fmt(it.lineTotal)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {cartItems.length > 0 && (
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Genel Toplam</span>
                                            <span className="text-lg font-black text-blue-600 tracking-tighter">{fmt(cartSummary?.grandTotal || 0)}</span>
                                        </div>
                                        <Link 
                                            href={getPath("/network/cart")}
                                            className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Sepete Git & Onayla
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

                        <Link
                            href={getPath("/network/account")} 
                            className="flex items-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                            title="Hesap Ayarları"
                        >
                            <UserCircle2 className="w-6 h-6" strokeWidth={1.2} />
                        </Link>
                    </div>

                </div>
            </header>

            <main>
                {children}
            </main>

            {/* Global Periodya B2B Footer Text */}
            <div className="w-full flex justify-center py-6 mt-12 mb-8 pointer-events-none">
                <div className="px-5 py-2.5 bg-slate-100/80 border border-slate-200 text-slate-500 text-xs font-semibold tracking-tight shadow-sm rounded-full backdrop-blur-sm">
                    Periodya B2B — Kurumsal ticaret altyapısı ile işinizi büyütün.
                </div>
            </div>
        </div>
    )
}
