"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    BarChart3, LayoutDashboard, WalletCards, Activity, 
    Map, Users, PhoneCall, ShieldAlert, Package, Search, ChevronRight
} from 'lucide-react';
import ModuleGatekeeper from "@/components/ModuleGatekeeper";

const REPORT_TABS = [
    {
        name: "Genel Ağ",
        items: [
            { id: 'overview', title: 'Özet Panosu', path: '/reports', icon: <LayoutDashboard size={16} /> },
            { id: 'ceo', title: 'Strateji Merkezi', path: '/reports/ceo', icon: <Activity size={16} /> }
        ]
    },
    {
        name: "Finans & Risk",
        items: [
            { id: 'profitability', title: 'Kârlılık Analizi', path: '/reports/finance/profitability', icon: <WalletCards size={16} /> },
            { id: 'aging', title: 'Oto Adisyon & Risk', path: '/reports/finance/aging', icon: <ShieldAlert size={16} /> },
            { id: 'reconciliation', title: 'Mutabakat Performansı', path: '/reports/finance/reconciliation', icon: <Search size={16} /> }
        ]
    },
    {
        name: "Operasyon & Satış",
        items: [
            { id: 'personnel', title: 'Personel Performansı', path: '/reports/sales/personnel', icon: <Users size={16} /> },
            { id: 'salesx', title: 'Saha (SalesX) Rotaları', path: '/reports/sales/salesx', icon: <Map size={16} /> }
        ]
    },
    {
        name: "Servis & Çağrı",
        items: [
            { id: 'service', title: 'Servis Masası SLA', path: '/reports/service/sla', icon: <Package size={16} /> },
            { id: 'calls', title: 'Çağrı Metrikleri', path: '/reports/service/calls', icon: <PhoneCall size={16} /> }
        ]
    }
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <ModuleGatekeeper moduleId="REPORTS">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full min-h-screen animate-in fade-in flex flex-col">
                
                {/* Mobile Nav Select Dropdown */}
                <div className="md:hidden w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm mb-4 gap-4">
                    <div className="text-[14px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-600" /> Mobil Rapor Gezgini
                    </div>
                    <select 
                        onChange={(e) => router.push(e.target.value)}
                        value={pathname}
                        className="text-[13px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 w-full sm:w-auto sm:flex-1 sm:ml-4 outline-none"
                    >
                        {REPORT_TABS.flatMap(g => g.items).map(item => (
                            <option key={item.id} value={item.path}>{item.title}</option>
                        ))}
                    </select>
                </div>

                {/* Desktop Grid Architecture */}
                <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr] items-start gap-4 md:gap-6 lg:gap-8 w-full flex-1">
                    
                    {/* Left Vertical Sub-Navigation Sidebar */}
                    <aside className="w-full shrink-0 sticky top-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm hidden md:flex flex-col overflow-hidden max-h-[calc(100vh-3rem)]">
                        
                        {/* Branding Header */}
                        <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                                <BarChart3 strokeWidth={2.5} size={20} />
                            </div>
                            <div>
                                <h1 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">Rapor Merkezi</h1>
                                <p className="text-[11px] font-bold text-slate-500">18 Modül Entegrasyonu</p>
                            </div>
                        </div>

                        {/* Vertical Nav Links */}
                        <div className="flex-1 overflow-y-auto w-full p-4 space-y-6 scrollbar-hide">
                            {REPORT_TABS.map((group, idx) => (
                                <div key={idx}>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-3">
                                        {group.name}
                                    </h3>
                                    <div className="flex flex-col gap-1">
                                        {group.items.map((tab) => {
                                            const isActive = tab.path === '/reports' 
                                                ? pathname === '/reports'
                                                : pathname.startsWith(tab.path);

                                            return (
                                                <Link 
                                                    key={tab.id} 
                                                    href={tab.path}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                                                        isActive
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                                                        : 'text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} transition-colors`}>
                                                            {tab.icon}
                                                        </div>
                                                        <span className="text-[12px]">{tab.title}</span>
                                                    </div>
                                                    {isActive && <ChevronRight size={14} className="opacity-50" strokeWidth={3} />}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content Render Area */}
                    <main className="w-full min-w-0 flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </ModuleGatekeeper>
    );
}
