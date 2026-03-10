"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const isNetworkPrefix = pathname.startsWith("/network");
    const getPath = (basePath: string) => isNetworkPrefix ? basePath : basePath.replace("/network", "");

    // Public sayfalar için minimal topbar veya gizli
    const isPublic = pathname === "/network/login" || pathname === "/login" || pathname === "/" || pathname.startsWith("/network/invite") || pathname.startsWith("/invite");
    if (isPublic) {
        return <>{children}</>
    }

    const navs = [
        { path: getPath("/network/dashboard"), label: "Dashboard" },
        { path: getPath("/network/catalog"), label: "Catalog" },
        { path: getPath("/network/orders"), label: "Orders" },
        { path: getPath("/network/account"), label: "Account" },
    ]

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Minimal Topbar */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <Link href={getPath("/network/dashboard")} className="text-xl font-bold tracking-tight text-blue-600">
                                B2B Portal
                            </Link>
                            <nav className="hidden md:ml-10 md:flex md:space-x-8">
                                {navs.map((nav) => {
                                    const active = pathname === nav.path || pathname.startsWith(`${nav.path}/`)
                                    return (
                                        <Link
                                            key={nav.path}
                                            href={nav.path}
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${active
                                                    ? "border-blue-500 text-slate-900"
                                                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                                }`}
                                        >
                                            {nav.label}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4 border-l border-slate-200 pl-4 ml-4">
                            <Link href={getPath("/network/cart")} className="text-sm font-semibold text-slate-700 hover:text-blue-600">
                                Sepet
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {children}
            </main>
        </div>
    )
}
