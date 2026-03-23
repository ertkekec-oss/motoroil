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
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/10 p-2 mb-8 shadow-sm flex flex-wrap gap-2">
            {tabs.map((tab) => {
                // Determine if active. For /catalog, we also want to match /catalog/* except if it's explicitly matched by another tab. 
                // Since my-products is /seller/products, we can just do exact or startsWith logic depending on the routes.
                // Simple startsWith works well in our case, except /catalog is the root.
                const isActive = pathname === tab.href || (tab.href !== "/catalog" ? pathname.startsWith(tab.href + "/") : pathname.startsWith("/catalog/"));

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
