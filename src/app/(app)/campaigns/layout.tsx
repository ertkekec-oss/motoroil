"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, CalendarClock, History, Target, BarChart2, Diamond } from "lucide-react";

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { href: '/campaigns', label: 'Özet (Dashboard)', icon: Target },
        { href: '/campaigns/active', label: 'Aktif Kampanyalar', icon: Gift },
        { href: '/campaigns/loyalty', label: 'Sadakat & Referans Sistemi', icon: Diamond },
        { href: '/campaigns/scheduled', label: 'Planlı Kampanyalar', icon: CalendarClock },
        { href: '/campaigns/history', label: 'Geçmiş Kurgular', icon: History },
        { href: '/campaigns/analytics', label: 'Performans & ROI', icon: BarChart2 }
    ];

    return (
        <div className="flex-1 flex flex-col p-6 w-full max-w-[1400px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Gift className="w-7 h-7 text-indigo-500" />
                        Campaign Engine V2
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Saha, Terminal ve Hub Kurgu Yönetimi</p>
                </div>
                <div>
                    <Link
                        href="/campaigns/create"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 flex items-center gap-2 rounded-xl transition shadow-lg shadow-indigo-500/20"
                    >
                        + Yeni Kampanya Oluştur
                    </Link>
                </div>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex space-x-6">
                    {tabs.map((tab) => {
                        const active = pathname === tab.href;
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-2 pb-3 border-b-2 font-medium text-[13px] transition-colors ${active ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex-1 rounded-2xl">
                {children}
            </div>
        </div>
    );
}
