"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Wallet, TrendingUp, ShieldAlert,
    Network, HardDrive, FileText, Settings, Users, Percent,
    CreditCard, Server, Activity, ArrowRightLeft, DatabaseZap, CheckCircle, Store, AlertTriangle, ShieldCheck,
    Search, Inbox, Library
} from 'lucide-react';

export function AdminSidebar({ userRole }: { userRole: string }) {
    const pathname = usePathname();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const isFinance = userRole === 'PLATFORM_FINANCE_ADMIN';
    const isGrowth = userRole === 'PLATFORM_GROWTH_ADMIN';
    const isRisk = userRole === 'PLATFORM_RISK_ADMIN';
    const isSuper = userRole === 'SUPER_ADMIN' || userRole === 'PLATFORM_ADMIN';

    const toggleGroup = (group: string) => {
        setOpenSections(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
        const isActive = pathname.startsWith(href) && href !== '/admin' || (href === '/admin/dashboard' && pathname === '/admin/dashboard');
        return (
            <Link href={href} className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </Link>
        );
    };

    const NavGroup = ({ title, icon: Icon, children, groupKey }: { title: string, icon: any, children: React.ReactNode, groupKey: string }) => {
        const isOpen = openSections[groupKey];
        // Auto open if active path is inside
        const isChildActive = React.Children.toArray(children).some((child: any) => {
            if (child.props.href && pathname.startsWith(child.props.href)) return true;
            return false;
        });

        React.useEffect(() => {
            if (isChildActive && openSections[groupKey] === undefined) {
                setOpenSections(prev => ({ ...prev, [groupKey]: true }));
            }
        }, [pathname, isChildActive, groupKey, openSections]);

        return (
            <div className="mb-1">
                <button
                    onClick={() => toggleGroup(groupKey)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${isOpen || isChildActive ? 'text-slate-100 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{title}</span>
                    </div>
                    <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l text-slate-500 border-slate-700/50 space-y-0.5">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    return (
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto hidden-scrollbar">
            {/* Executive Dashboard */}
            <div className="space-y-1">
                {(isSuper || isFinance || isGrowth || isRisk) && (
                    <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Yönetim Paneli" />
                )}
            </div>

            {/* PERİODYA HUB (Sabit Menü) */}
            <div className="space-y-1">
                <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    PERİODYA HUB
                </div>
                {(isSuper || isGrowth || isFinance) && (
                    <NavGroup title="Growth & Monetization" icon={TrendingUp} groupKey="growth">
                        <NavItem href="/admin/hub/growth/boost" icon={TrendingUp} label="Boost Yönetimi" />
                        <NavItem href="/admin/hub/growth/trust-score" icon={Activity} label="Trust Score" />
                        <NavItem href="/admin/hub/growth/campaigns" icon={FileText} label="Kampanyalar" />
                    </NavGroup>
                )}
                {(isSuper || isRisk) && (
                    <NavGroup title="Risk & Resolution" icon={ShieldAlert} groupKey="risk">
                        <NavItem href="/admin/hub/risk/credit" icon={AlertTriangle} label="Kredi Risk Merkezi" />
                        <NavItem href="/admin/hub/risk/escrow" icon={ArrowRightLeft} label="Escrow Uyuşmazlık" />
                        <NavItem href="/admin/hub/risk/abuse" icon={ShieldCheck} label="Kötüye Kullanım" />
                    </NavGroup>
                )}
                {isSuper && (
                    <NavGroup title="Network Governance" icon={Network} groupKey="network">
                        <NavItem href="/admin/hub/network/categories" icon={DatabaseZap} label="Kategoriler" />
                        <NavItem href="/admin/hub/network/commissions" icon={Percent} label="Komisyon Havuzu" />
                        <NavItem href="/admin/hub/network/brands" icon={CheckCircle} label="Markalar" />
                    </NavGroup>
                )}
                {isSuper && (
                    <NavGroup title="System & Infrastructure" icon={HardDrive} groupKey="infra">
                        <NavItem href="/admin/hub/infra/gateways" icon={Server} label="Aracı Kurumlar (Gateway)" />
                        <NavItem href="/admin/hub/infra/fintech" icon={DatabaseZap} label="Fintech Routing" />
                        <NavItem href="/admin/hub/infra/limits" icon={Activity} label="API Limitleri" />
                    </NavGroup>
                )}
            </div>

            {/* B2B NETWORK */}
            {isSuper && (
                <div className="space-y-1">
                    <div className="px-3 mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        B2B NETWORK
                    </div>
                    <NavItem href="/admin/b2b/dealer-orders" icon={Activity} label="B2B Sipariş Kuyruğu" />
                    <NavItem href="/admin/b2b/refunds" icon={ArrowRightLeft} label="İade ve Uyuşmazlıklar" />
                    <NavItem href="/admin/b2b/policies" icon={ShieldAlert} label="Login & Risk Politikaları" />
                </div>
            )}

            {/* PERİODYA AYARLARI */}
            {isSuper && (
                <div className="space-y-1">
                    <div className="px-3 mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        PERİODYA AYARLARI
                    </div>
                    <NavItem href="/admin/audit-logs" icon={Search} label="Sistem Kayıtları" />
                    <NavItem href="/admin/security-kit" icon={ShieldAlert} label="Güvenlik Kalkanı" />
                    <NavItem href="/admin/tenants" icon={Users} label="Tüm Müşteriler" />
                    <NavItem href="/admin/saas-plans" icon={CreditCard} label="SaaS Planları" />
                    <NavItem href="/admin/support/tickets" icon={Inbox} label="Destek Biletleri" />
                    <NavItem href="/admin/tenants/PLATFORM_ADMIN/help" icon={Library} label="Bilgi Bankası" />
                </div>
            )}
        </nav>
    );
}
