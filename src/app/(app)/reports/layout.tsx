"use client";

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3 } from 'lucide-react';

const REPORT_TABS = [
    {
        name: "Genel",
        items: [
            { id: 'overview', title: 'Genel Özet Dashboard', path: '/reports' },
            { id: 'ceo', title: 'Strateji Merkezi', path: '/reports/ceo' }
        ]
    },
    {
        name: "Finans",
        items: [
            { id: 'profitability', title: 'Kârlılık Analizi', path: '/reports/finance/profitability' },
            { id: 'aging', title: 'Oto Adisyon & Yaşlandırma', path: '/reports/finance/aging' },
            { id: 'reconciliation', title: 'Mutabakat Performansı', path: '/reports/finance/reconciliation' },
            { id: 'anomalies', title: 'Sistem Anomalileri', path: '/reports/finance/anomalies' }
        ]
    },
    {
        name: "Satış",
        items: [
            { id: 'personnel', title: 'Personel Satış Performansı', path: '/reports/sales/personnel' },
            { id: 'conversion', title: 'Teklif Dönüşüm Oranları', path: '/reports/sales/conversion' },
            { id: 'salesx', title: 'Saha (SalesX) Rotaları', path: '/reports/sales/salesx' },
            { id: 'campaigns', title: 'Kampanya Etkililiği', path: '/reports/sales/campaigns' }
        ]
    },
    {
        name: "Servis",
        items: [
            { id: 'service', title: 'Servis Masası & SLA', path: '/reports/service/sla' },
            { id: 'calls', title: 'Çağrı Metrikleri', path: '/reports/service/calls' },
            { id: 'mailing', title: 'Toplu İletişim', path: '/reports/service/mailing' }
        ]
    },
    {
        name: "Kaynak",
        items: [
            { id: 'inventory', title: 'Stok Devir Hızı', path: '/reports/resources/inventory' },
            { id: 'bom', title: 'BOM Üretim Maliyet', path: '/reports/resources/bom' },
            { id: 'assets', title: 'Demirbaş Zimmet', path: '/reports/resources/assets' },
            { id: 'hr', title: 'IK Puantaj', path: '/reports/resources/hr' }
        ]
    }
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active tab logic
    useEffect(() => {
        if (!scrollContainerRef.current) return;
        const activeLink = scrollContainerRef.current.querySelector('a[data-active="true"]');
        if (activeLink) {
            activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [pathname]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220] flex flex-col relative w-full overflow-hidden">
            {/* Global Report Navigation Header */}
            <div className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 w-full shadow-sm">
                <div className="max-w-[1600px] mx-auto w-full flex flex-row items-center justify-start gap-4 p-2 px-3 sm:px-6">
                    
                    {/* Module Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                            <BarChart3 strokeWidth={2.5} size={16} />
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-[14px] font-black text-slate-900 dark:text-white leading-none tracking-tight">
                                Raporlama Panosu
                            </h1>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                Analitik Motoru
                            </p>
                        </div>
                    </div>

                    {/* Horizontal Pill Navigation Menu */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex-1 w-full overflow-x-auto scrollbar-hide flex items-center gap-2 pb-0.5"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {REPORT_TABS.map((group, groupIdx) => (
                            <React.Fragment key={group.name}>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-[3px] rounded-full border border-slate-200/60 dark:border-white/5 flex items-center shrink-0">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 pr-1.5 select-none hidden sm:block">
                                        {group.name}
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        {group.items.map((tab) => {
                                            const isActive = tab.path === '/reports' 
                                                ? pathname === '/reports'
                                                : pathname.startsWith(tab.path);
                                            
                                            return (
                                                <Link 
                                                    key={tab.id}
                                                    href={tab.path}
                                                    data-active={isActive}
                                                    className={`px-3 py-1 rounded-full text-[12px] transition-all whitespace-nowrap outline-none ${
                                                        isActive 
                                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 font-bold' 
                                                        : 'text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                                    }`}
                                                >
                                                    {tab.title}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                                {groupIdx < REPORT_TABS.length - 1 && (
                                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                </div>
            </div>

            {/* Page Content Render Area */}
            <div className="flex-1 w-full relative">
                {children}
            </div>
        </div>
    );
}
