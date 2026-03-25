"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, ShoppingCart, ShoppingBag, BarChart3 } from "lucide-react";

export default function HubOrdersTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      id: "dashboard",
      name: "Genel Bakış",
      icon: BarChart3,
      href: "/hub/orders",
    },
    {
      id: "rfqs",
      name: "Gelen Müzakereler",
      icon: Inbox,
      href: "/seller/rfqs",
    },
    {
      id: "sales",
      name: "Alınan Siparişler",
      icon: ShoppingCart,
      href: "/hub/seller/orders",
    },
    {
      id: "purchases",
      name: "Açık Siparişler",
      icon: ShoppingBag,
      href: "/hub/buyer/orders",
    },
  ];

  return (
    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/10 mb-8 px-2 overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 pb-3 pt-1 font-semibold text-[13px] whitespace-nowrap transition-colors relative ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.name}

            {/* Active Indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
