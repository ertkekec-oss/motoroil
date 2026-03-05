"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Wallet, TrendingUp, ShieldAlert,
    Network, HardDrive, FileText, Settings, Users, Percent,
    CreditCard, Server, Activity, ArrowRightLeft, DatabaseZap, CheckCircle, Store, AlertTriangle, ShieldCheck,
    Search, Inbox, Library, Mail
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
            {/* Yönetim - Sabit başlık */}
            <div className="space-y-1 mb-6">
                <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Yönetim
                </div>

                {(isSuper || isFinance || isGrowth || isRisk) && (
                    <NavGroup title="YÖNETİM" icon={LayoutDashboard} groupKey="yonetim_main">
                        <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Yönetim Dashboard" />
                        {isSuper && (
                            <>
                                <NavItem href="/admin/tenants" icon={Users} label="Tüm Müşteriler" />
                                <NavItem href="/admin/plans" icon={CreditCard} label="SaaS Planları" />
                            </>
                        )}
                    </NavGroup>
                )}

                {isSuper && (
                    <NavGroup title="TİCKET" icon={Inbox} groupKey="ticket_main">
                        <NavItem href="/admin/support/tickets" icon={Inbox} label="Destek Biletleri" />
                        <NavItem href="/admin/tenants/PLATFORM_ADMIN/help" icon={Library} label="Bilgi Bankası" />
                    </NavGroup>
                )}
            </div>

            {/* B2B GLOBAL - Sabit başlık */}
            <div className="space-y-1 mb-6">
                <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    B2B GLOBAL
                </div>

                <NavGroup title="PERİODYA HUB" icon={Network} groupKey="hub_main">
                    {(isSuper || isFinance) && (
                        <NavGroup title="Finans & Escrow" icon={Wallet} groupKey="finance">
                            <NavItem href="/admin/payments-escrow/policies" icon={FileText} label="Escrow Politikaları" />
                            <NavItem href="/admin/payments-escrow/commissions" icon={Percent} label="Komisyon Planları" />
                            <NavItem href="/admin/payouts" icon={ArrowRightLeft} label="Ödeme Kontrolü" />
                            <NavItem href="/admin/payments-escrow/providers" icon={CreditCard} label="Ödeme Sağlayıcıları" />
                            <NavItem href="/admin/payments-escrow/audit" icon={ShieldCheck} label="Finans Denetimi" />
                        </NavGroup>
                    )}

                    {(isSuper || isGrowth || isFinance) && (
                        <NavGroup title="Growth & Monetization" icon={TrendingUp} groupKey="growth">
                            <NavItem href="/admin/growth/boost-rules" icon={TrendingUp} label="Boost Kuralları" />
                            <NavItem href="/admin/growth/billing-health" icon={Activity} label="Fatura Sağlığı" />
                            <NavItem href="/admin/growth/revenue" icon={LayoutDashboard} label="Gelir İstatislikleri" />
                            <NavItem href="/admin/growth/audit" icon={FileText} label="Büyüme Denetimi" />
                            <NavItem href="/admin/growth/subscriptions" icon={Users} label="Hub Abonelikleri" />
                        </NavGroup>
                    )}

                    {(isSuper || isRisk) && (
                        <NavGroup title="Risk & Resolution" icon={ShieldAlert} groupKey="risk">
                            <NavItem href="/admin/disputes" icon={AlertTriangle} label="Uyuşmazlık Kuyruğu" />
                            <NavItem href="/admin/trust-monitor" icon={Activity} label="Güven Monitörü" />
                            <NavItem href="/admin/disputes/policies" icon={FileText} label="Çözüm Politikaları" />
                        </NavGroup>
                    )}

                    {isSuper && (
                        <NavGroup title="Network Governance" icon={Network} groupKey="network">
                            <NavItem href="/admin/companies" icon={Store} label="Firmalar" />
                            <NavItem href="/admin/catalog/categories" icon={DatabaseZap} label="Kategoriler" />
                            <NavItem href="/admin/catalog/brands" icon={CheckCircle} label="Markalar" />
                            <NavItem href="/admin/products" icon={CheckCircle} label="Ürün Onayları" />
                        </NavGroup>
                    )}

                    {isSuper && (
                        <NavGroup title="System & Infrastructure" icon={HardDrive} groupKey="system">
                            <NavItem href="/admin/ops/gateways" icon={Server} label="Aracı Kurumlar (Gateway)" />
                            <NavItem href="/admin/ops/fintech" icon={DatabaseZap} label="Fintech Routing" />
                            <NavItem href="/admin/ops/limits" icon={Activity} label="API Limitleri" />
                            <NavItem href="/admin/ops/providers" icon={Server} label="Platform Altyapısı" />
                            <NavItem href="/admin/ops/ledgers" icon={DatabaseZap} label="Sistem Defteri" />
                        </NavGroup>
                    )}
                </NavGroup>

                {isSuper && (
                    <NavGroup title="B2B NETWORK" icon={Store} groupKey="b2b_network_main">
                        <NavItem href="/admin/b2b/dealer-orders" icon={Activity} label="B2B Sipariş Kuyruğu" />
                        <NavItem href="/admin/b2b/refunds" icon={ArrowRightLeft} label="B2B İade ve Uyuşmazlıklar" />
                        <NavItem href="/admin/b2b/policies" icon={ShieldAlert} label="B2B Risk Politikaları" />
                    </NavGroup>
                )}
            </div>

            {/* GÜVENLİK VE AYARLAR - SABİT BAŞLIK */}
            {isSuper && (
                <div className="space-y-1">
                    <div className="px-3 mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        GÜVENLİK VE AYARLAR
                    </div>

                    <NavGroup title="LOGLAR VE GÜVENLİK" icon={ShieldAlert} groupKey="logs_security_main">
                        <NavItem href="/admin/audit-logs" icon={Search} label="Denetim Kayıtları" />
                        <NavItem href="/admin/logs" icon={Activity} label="Sistem Kayıtları" />
                        <NavItem href="/admin/security" icon={ShieldCheck} label="Güvenlik Kalkanı" />
                    </NavGroup>

                    <NavGroup title="AYARLAR" icon={Settings} groupKey="settings_main">
                        <NavItem href="/admin/settings/mail" icon={Mail} label="Mail Ayarları (Global)" />
                    </NavGroup>
                </div>
            )}
        </nav>
    );
}
