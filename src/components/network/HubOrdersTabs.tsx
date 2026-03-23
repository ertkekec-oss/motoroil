"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, ShoppingCart, ShoppingBag, BarChart3 } from "lucide-react";

export default function HubOrdersTabs() {
    const pathname = usePathname();

    const tabs = [
        { id: "dashboard", name: "Genel Bakış", icon: BarChart3, href: "/hub/orders" },
        { id: "rfqs", name: "Gelen Müzakereler", icon: Inbox, href: "/seller/rfqs" },
        { id: "sales", name: "Alınan Siparişler", icon: ShoppingCart, href: "/hub/seller/orders" },
        { id: "purchases", name: "Açık Siparişler", icon: ShoppingBag, href: "/hub/buyer/orders" }
    ];

    return (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/10 p-2 mb-8 shadow-sm flex overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 ${
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
