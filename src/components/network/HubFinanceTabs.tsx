"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, TrendingUp, BarChart, ShieldCheck, PieChart } from "lucide-react";

export default function HubFinanceTabs() {
    const pathname = usePathname();

    const tabs = [
        { id: "dashboard", name: "Genel Bakış", icon: PieChart, href: "/hub/finance/dashboard" },
        { id: "finance", name: "Cüzdan & B2B Finans", icon: Wallet, href: "/hub/finance" },
        { id: "boost", name: "Boost Yönetimi", icon: TrendingUp, href: "/seller/boost" },
        { id: "analytics", name: "Boost Analitik", icon: BarChart, href: "/seller/boost/analytics" },
        { id: "trust", name: "Güven Skoru (Trust Score)", icon: ShieldCheck, href: "/hub/trust-score" }
    ];

    return (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/10 p-2 mb-8 shadow-sm flex flex-wrap gap-2 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href || (tab.id === 'finance' && pathname.startsWith('/hub/finance') && pathname !== '/hub/finance/dashboard');

                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 flex-1 sm:flex-none justify-center ${
                            isActive
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? "text-blue-500" : "opacity-60"}`} />
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
