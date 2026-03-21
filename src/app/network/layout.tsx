"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNetworkPath } from "@/hooks/useNetworkPath"
import { ShoppingCart, UserCircle2 } from "lucide-react"

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const getPath = useNetworkPath()

    // Setup mounted state to avoid hydration mismatch on dynamic links
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Public sayfalar için minimal topbar veya gizli
    const isPublic = pathname === "/network/login" || pathname === "/login" || pathname === "/" || pathname.startsWith("/network/invite") || pathname.startsWith("/invite");
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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Premium Top Navigation */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-16 shadow-sm">
                <div className="mx-auto max-w-7xl px-6 h-full flex items-center justify-between">
                    
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
                            // Tam Dashboard mu yoksa alt endpointler mi kontrolü
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
                                    {/* Active Underline Indicator */}
                                    {active && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-5">
                        <Link 
                            href={getPath("/network/cart")} 
                            className="relative flex items-center text-slate-500 hover:text-blue-600 transition-colors group"
                            title="Sepet"
                        >
                            <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                            {/* Minimal Ping Badge if active (mocked as visually alive) */}
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border-2 border-white"></span>
                            </span>
                        </Link>

                        <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

                        <Link
                            href={getPath("/network/account")} 
                            className="flex items-center text-slate-500 hover:text-slate-900 transition-colors"
                            title="Hesap Ayarları"
                        >
                            <UserCircle2 className="w-6 h-6" strokeWidth={1.5} />
                        </Link>
                    </div>

                </div>
            </header>

            <main>
                {children}
            </main>
        </div>
    )
}
