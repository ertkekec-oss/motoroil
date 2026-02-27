"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Wallet, TrendingUp, ShieldAlert,
    Network, HardDrive, FileText, Settings, Users, Percent,
    CreditCard, Server, Activity, ArrowRightLeft, DatabaseZap, CheckCircle, Store, AlertTriangle, ShieldCheck
} from 'lucide-react';

export function AdminSidebar({ userRole }: { userRole: string }) {
    const pathname = usePathname();
    const [openGroup, setOpenGroup] = useState<string | null>(null);

    const isFinance = userRole === 'PLATFORM_FINANCE_ADMIN';
    const isGrowth = userRole === 'PLATFORM_GROWTH_ADMIN';
    const isRisk = userRole === 'PLATFORM_RISK_ADMIN';
    const isSuper = userRole === 'SUPER_ADMIN' || userRole === 'PLATFORM_ADMIN';

    const toggleGroup = (group: string) => {
        setOpenGroup(openGroup === group ? null : group);
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
        const isOpen = openGroup === groupKey;
        // Auto open if active path is inside
        const isChildActive = React.Children.toArray(children).some((child: any) => pathname.startsWith(child.props.href));

        React.useEffect(() => {
            if (isChildActive && openGroup !== groupKey) {
                setOpenGroup(groupKey);
            }
        }, [pathname, isChildActive, groupKey]);

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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto hidden-scrollbar">
            {(isSuper || isFinance || isGrowth || isRisk) && (
                <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Executive Dashboard" />
            )}

            {/* FINANCE & ESCROW */}
            {(isSuper || isFinance) && (
                <NavGroup title="Finance & Escrow" icon={Wallet} groupKey="finance">
                    <NavItem href="/admin/payments-escrow/policies" icon={FileText} label="Escrow Policies" />
                    <NavItem href="/admin/payments-escrow/commissions" icon={Percent} label="Commission Plans" />
                    <NavItem href="/admin/payouts" icon={ArrowRightLeft} label="Payout Control" />
                    <NavItem href="/admin/payments-escrow/providers" icon={CreditCard} label="Providers" />
                    <NavItem href="/admin/payments-escrow/audit" icon={ShieldCheck} label="Finance Audit Log" />
                </NavGroup>
            )}

            {/* GROWTH & MONETIZATION */}
            {(isSuper || isGrowth || isFinance) && (
                <NavGroup title="Growth & Monetization" icon={TrendingUp} groupKey="growth">
                    <NavItem href="/admin/growth/boost-rules" icon={TrendingUp} label="Boost Rules" />
                    <NavItem href="/admin/growth/billing-health" icon={Activity} label="Billing Health" />
                    <NavItem href="/admin/growth/revenue" icon={LayoutDashboard} label="Revenue Analytics" />
                    <NavItem href="/admin/growth/audit" icon={FileText} label="Growth Audit" />
                    <NavItem href="/admin/growth/subscriptions" icon={Users} label="Hub Subscriptions" />
                </NavGroup>
            )}

            {/* RISK & RESOLUTION */}
            {(isSuper || isRisk) && (
                <NavGroup title="Risk & Resolution" icon={ShieldAlert} groupKey="risk">
                    <NavItem href="/admin/disputes" icon={AlertTriangle} label="Dispute Queue" />
                    <NavItem href="/admin/trust-monitor" icon={Activity} label="Trust Monitor" />
                    {/* SLA Alerts can be added here if exists, mapping to empty route for now */}
                    <NavItem href="/admin/disputes/policies" icon={FileText} label="Resolution Policies" />
                </NavGroup>
            )}

            {/* NETWORK GOVERNANCE */}
            {isSuper && (
                <NavGroup title="Network Governance" icon={Network} groupKey="network">
                    <NavItem href="/admin/companies" icon={Store} label="Companies" />
                    <NavItem href="/admin/catalog/categories" icon={DatabaseZap} label="Categories" />
                    <NavItem href="/admin/products" icon={CheckCircle} label="Product Approvals" />
                    <NavItem href="/admin/tenants" icon={Users} label="All Tenants" />
                    <NavItem href="/admin/plans" icon={FileText} label="SaaS Plans" />
                </NavGroup>
            )}

            {/* SYSTEM & INFRASTRUCTURE */}
            {isSuper && (
                <NavGroup title="System & Infrastructure" icon={HardDrive} groupKey="system">
                    <NavItem href="/admin/ops/providers" icon={Server} label="Platform Infra" />
                    <NavItem href="/admin/ops/ledgers" icon={DatabaseZap} label="System Ledger" />
                    <NavItem href="/admin/security" icon={ShieldAlert} label="Security Kit" />
                    <NavItem href="/admin/logs" icon={Activity} label="System Logs" />
                </NavGroup>
            )}
        </nav>
    );
}
