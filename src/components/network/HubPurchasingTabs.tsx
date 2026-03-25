"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchCode, FileSignature } from "lucide-react";

export default function HubPurchasingTabs() {
  const pathname = usePathname();

  const tabs = [
    { id: "rfq", name: "RFQ (Taleplerim)", icon: SearchCode, href: "/rfq" },
    {
      id: "contracts",
      name: "B2B Sözleşmeler",
      icon: FileSignature,
      href: "/contracts",
    },
  ];

  return (
    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/10 mb-8 px-2 overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + "/");

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
