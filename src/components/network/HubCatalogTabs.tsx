"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Store, LayoutGrid } from "lucide-react";

export default function HubCatalogTabs() {
    const pathname = usePathname();

    const tabs = [
        { id: "explore", name: "B2B Keşfet", icon: Search, href: "/catalog" },
        { id: "my-products", name: "Benim Ürünlerim", icon: Store, href: "/seller/products" },
        { id: "categories", name: "Kategori Eşleştirme", icon: LayoutGrid, href: "/seller/categories" }
    ];

    return (
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 mb-8 pb-px">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href || (tab.href !== "/catalog" ? pathname.startsWith(tab.href + "/") : pathname.startsWith("/catalog/"));
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-2 px-5 py-3 text-[13px] font-bold transition-all relative ${
                            isActive
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-50"}`} />
                        {tab.name}
                        {isActive && (
                            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 dark:bg-indigo-500 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.4)]"></div>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
