"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import {
    Terminal, Globe, ShoppingCart, Package, Briefcase, TrendingUp, Handshake,
    UserCircle, Landmark, Receipt, Users, Truck, Activity, Box, Map, FileText,
    Wrench, BarChart2, Clock, Search, ShieldAlert, LifeBuoy, Settings, CreditCard,
    ChevronDown, ChevronRight, Store, Inbox, Library, LogOut
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const { user: authUser, logout } = useAuth();
    const {
        currentUser, hasPermission, hasFeature, subscription,
        branches, activeBranchName, setActiveBranchName,
        suspiciousEvents, isSidebarOpen, setIsSidebarOpen,
        isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed,
        activeTenantId, setActiveTenantId, availableTenants
    } = useApp();

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    // Retrieve collapsed state memory
    useEffect(() => {
        const saved = localStorage.getItem('pdy_sidebar_collapsed');
        if (saved !== null) {
            setIsDesktopSidebarCollapsed(saved === 'true');
        }
    }, [setIsDesktopSidebarCollapsed]);

    const handleCollapseToggle = () => {
        const newVal = !isDesktopSidebarCollapsed;
        setIsDesktopSidebarCollapsed(newVal);
        localStorage.setItem('pdy_sidebar_collapsed', newVal.toString());
    };

    const toggleSection = (id: string) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Auto-expand if active
    useEffect(() => {
        const expandMap: Record<string, string[]> = {
            'orders-parent': ['/orders', '/network/seller/orders', '/network/buyer/orders'],
            'catalog-parent': ['/seller/products', '/catalog'],
            'growth-parent': ['/network/trust-score', '/network/stock-risks', '/seller/boost', '/seller/boost/analytics'],
            'purchasing-parent': ['/rfq', '/contracts', '/network/buyer'],
            'field-sales-parent': ['/field-sales'],
            'reports-parent': ['/reports'],
        };

        const newOpen = { ...openSections };
        let changed = false;

        Object.entries(expandMap).forEach(([id, paths]) => {
            if (paths.some(p => pathname.includes(p))) {
                if (!newOpen[id]) {
                    newOpen[id] = true;
                    changed = true;
                }
            }
        });

        if (changed) {
            setOpenSections(newOpen);
        }
    }, [pathname]);

    const isSystemAdmin = currentUser === null || currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));
    const isPlatformAdmin = authUser?.tenantId === 'PLATFORM_ADMIN' || authUser?.role === 'SUPER_ADMIN' || authUser?.role === 'SUPPORT_AGENT';
    const isAuditor = currentUser?.role === 'AUDITOR';
    const displayUser = currentUser || authUser;

    // UI mapping for permissions
    const permMap: Record<string, { perm?: string, feature?: string }> = {
        '/': { perm: 'pos_access', feature: 'pos' },
        '/terminal': { perm: 'pos_access', feature: 'pos' },
        '/accounting': { perm: 'finance_view', feature: 'financials' },
        '/customers': { perm: 'customer_view', feature: 'current_accounts' },
        '/suppliers': { perm: 'supplier_view', feature: 'suppliers' },
        '/inventory': { perm: 'inventory_view', feature: 'inventory' },
        '/service': { perm: 'service_view', feature: 'service_desk' },
        '/sales': { perm: 'sales_archive', feature: 'sales' },
        '/field-sales': { perm: 'field_sales_access', feature: 'field_sales' },
        '/field-sales/admin/live': { perm: 'field_sales_admin', feature: 'field_sales' },
        '/field-sales/admin/routes': { perm: 'field_sales_admin', feature: 'field_sales' },
        '/quotes': { perm: 'offer_create', feature: 'quotes' },
        '/reports': { perm: 'reports_view', feature: 'analytics' },
        '/reports/ceo': { perm: 'reports_view', feature: 'ceo_intel' },
        '/reports/daily': { perm: 'reports_view', feature: 'analytics' },
        '/reports/suppliers': { perm: 'reports_view', feature: 'analytics' },
        '/integrations': { perm: 'settings_manage', feature: 'e_invoice' },
        '/settings/branch': { perm: 'settings_manage' },
        '/settings': { perm: 'settings_manage' },
        '/staff': { perm: 'staff_manage', feature: 'team_management' },
        '/advisor': { perm: 'finance_view', feature: 'accountant' },
        '/admin/audit-logs': { perm: 'audit_view' },
        '/staff/pdks': { perm: 'staff_manage' },
        '/security/suspicious': { perm: 'security_access' },
        '/billing': { perm: 'settings_manage' },
        '/field-mobile/routes': { perm: 'field_sales_access' },
        '/staff/me': { perm: 'pos_access' },
        '/fintech/control-tower': { perm: 'finance_view', feature: 'fintech_tower' },
        '/fintech/profitability-heatmap': { perm: 'finance_view', feature: 'pnl_heatmap' },
        '/fintech/open-banking': { perm: 'finance_view' },
        '/fintech/smart-pricing': { perm: 'finance_view', feature: 'smart_pricing' },
        '/notifications': { perm: 'pos_access' },
        '/network/buyer/orders': { perm: 'supplier_view' },
        '/network/seller/orders': { perm: 'sales_archive' },
    };

    // @ts-ignore
    const isBuyer = isSystemAdmin || hasPermission('supplier_view') || currentUser?.type === 'buying';
    // @ts-ignore
    const isSeller = isSystemAdmin || hasPermission('sales_archive') || currentUser?.type === 'selling';

    const menuGroups = [
        {
            group: "Workspace",
            items: [
                { name: 'POS Terminal', href: '/terminal', icon: Terminal },
                { name: 'B2B Network', href: '/dashboard', icon: Globe },
                {
                    name: 'Siparişler',
                    icon: ShoppingCart,
                    isParent: true,
                    id: 'orders-parent',
                    subItems: [
                        ...(isSeller ? [{ name: 'Alınan Siparişler', href: '/network/seller/orders' }] : []),
                        ...(isBuyer ? [{ name: 'Açık Siparişler', href: '/network/buyer/orders' }] : [])
                    ]
                },
                {
                    name: 'Katalog',
                    icon: Package,
                    isParent: true,
                    id: 'catalog-parent',
                    subItems: [
                        ...(isSeller ? [{ name: 'Ürünlerim', href: '/seller/products' }] : []),
                        ...(isBuyer ? [{ name: 'B2B Keşfet', href: '/catalog' }] : [])
                    ]
                },
            ]
        },
        {
            group: "Ticari İstihbarat",
            items: [
                { name: 'Finance (B2B)', href: '/network/finance', icon: Briefcase },
                ...(isSeller ? [{
                    name: 'Growth (Satıcı)',
                    icon: TrendingUp,
                    isParent: true,
                    id: 'growth-parent',
                    subItems: [
                        { name: 'Boost Yönetimi', href: '/seller/boost' },
                        { name: 'Boost Analiz', href: '/seller/boost/analytics' },
                        { name: 'Güven Skoru', href: '/network/trust-score' }
                    ]
                }] : []),
                ...(isBuyer ? [{
                    name: 'Satınalma (Alıcı)',
                    icon: Handshake,
                    isParent: true,
                    id: 'purchasing-parent',
                    subItems: [
                        { name: 'Sözleşmeler', href: '/contracts' },
                        { name: 'RFQ Talepleri', href: '/rfq' }
                    ]
                }] : [])
            ]
        },
        {
            group: "Operasyonlar",
            items: [
                { name: 'Personel Portalı', href: '/staff/me', icon: UserCircle },
                { name: 'Muhasebe', href: '/accounting', icon: Landmark },
                { name: 'Satış', href: '/sales', icon: Receipt },
                { name: 'Cari Hesaplar', href: '/customers', icon: Users },
                { name: 'Tedarikçiler', href: '/suppliers', icon: Truck },
                { name: 'Fintech Tower', href: '/fintech/control-tower', icon: Activity },
                { name: 'Envanter', href: '/inventory', icon: Box },
                {
                    name: 'Saha Satış',
                    icon: Map,
                    isParent: true,
                    id: 'field-sales-parent',
                    subItems: [
                        { name: 'Saha Yönetimi', href: '/field-sales/admin/routes' },
                        { name: 'Rota & Müşteri', href: '/field-sales' },
                        { name: 'Canlı Takip', href: '/field-sales/admin/live' },
                    ]
                },
                { name: 'Teklifler', href: '/quotes', icon: FileText },
                { name: 'Servis', href: '/service', icon: Wrench },
            ]
        },
        {
            group: "Analitik & Yönetim",
            items: [
                {
                    name: 'İş Zekası',
                    icon: BarChart2,
                    isParent: true,
                    id: 'reports-parent',
                    subItems: [
                        { name: 'CEO Tablosu', href: '/reports/ceo' },
                        { name: 'Detaylı Analiz', href: '/reports' },
                    ]
                },
                { name: 'PDKS', href: '/staff/pdks', icon: Clock },
                { name: 'Denetim', href: '/admin/audit-logs', icon: Search },
                { name: 'Anomaliler', href: '/security/suspicious', icon: ShieldAlert, alertCount: suspiciousEvents.length },
                { name: 'Destek', href: '/support/tickets', icon: LifeBuoy },
            ]
        },
        {
            group: "Sistem",
            items: [
                { name: 'Mali Müşavir', href: '/advisor', icon: Briefcase },
                { name: 'Ayarlar', href: '/settings', icon: Settings },
                { name: 'Ekipler', href: '/staff', icon: Users },
                { name: 'Abonelik', href: '/billing', icon: CreditCard },
                ...(isPlatformAdmin ? [
                    { name: 'Support Inbox', href: '/admin/support/tickets', icon: Inbox },
                    { name: 'Bilgi Bankası', href: '/admin/tenants/PLATFORM_ADMIN/help', icon: Library }
                ] : []),
            ]
        }
    ];

    const filteredGroups = menuGroups.map(group => {
        const items = group.items.filter(item => {
            const config = permMap[item.href || ''];
            if (!config && !item.isParent) return true;
            if (isAuditor) {
                return ['/admin/audit-logs', '/reports', '/advisor'].includes(item.href || '');
            }
            if (config?.feature && !hasFeature(config.feature)) return false;
            if (isSystemAdmin) return true;
            if (config?.perm) return hasPermission(config.perm);
            return true;
        }).map(item => {
            if (item.subItems) {
                return {
                    ...item,
                    subItems: item.subItems.filter(sub => {
                        const subConfig = permMap[sub.href];
                        if (!subConfig) return true;
                        if (subConfig.feature && !hasFeature(subConfig.feature)) return false;
                        if (isSystemAdmin) return true;
                        if (subConfig.perm) return hasPermission(subConfig.perm);
                        return true;
                    })
                };
            }
            return item;
        });

        // Filter out parent items that have no authorized subItems
        const validItems = items.filter(item => {
            if (item.isParent && (!item.subItems || item.subItems.length === 0)) return false;
            return true;
        });

        return { ...group, items: validItems };
    }).filter(g => g.items.length > 0);


    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveBranchName(e.target.value);
    };

    const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveTenantId(e.target.value === 'null' ? null : e.target.value);
    };

    if (!displayUser) return null;

    return (
        <aside
            className={`pdy-sidebar flex flex-col flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width] fixed lg:relative z-[2000] h-screen
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${isDesktopSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}`}
        >
            {/* MOBILE CLOSE BUTTON */}
            <button
                className="lg:hidden absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: 'var(--sb-muted)' }}
                onClick={() => setIsSidebarOpen(false)}
            >
                ✕
            </button>

            {/* LOGO & BRANDING */}
            <div className="flex-shrink-0 p-5 pb-3">
                <div className={`flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isDesktopSidebarCollapsed && (
                        <div className="flex flex-col">
                            <h1 className="text-[22px] font-[900] tracking-[-1px] leading-none" style={{ color: 'var(--sb-text)' }}>
                                PERIOD<span style={{ color: 'var(--sb-accent)' }}>YA</span>
                            </h1>
                            <span className="text-[10px] font-bold tracking-[1.5px] uppercase mt-1 opacity-80" style={{ color: 'var(--sb-accent)' }}>
                                ENTERPRISE
                            </span>
                        </div>
                    )}

                    {isDesktopSidebarCollapsed && (
                        <div
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-white font-[900] text-xl cursor-pointer transition-colors hover:brightness-110"
                            style={{ background: 'var(--sb-accent)' }}
                            onClick={handleCollapseToggle}
                        >
                            P
                        </div>
                    )}

                    {!isDesktopSidebarCollapsed && (
                        <button
                            onClick={handleCollapseToggle}
                            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md transition-transform hover:scale-105 pdy-sb-collapse-btn"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* CONTEXT SELECTORS */}
            <div className="px-5 pb-4 space-y-3 flex-shrink-0">
                {isPlatformAdmin && !isDesktopSidebarCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider mb-1.5 px-0.5" style={{ color: 'var(--sb-muted)' }}>Yönetilen Alan</span>
                        <select
                            value={activeTenantId || 'null'}
                            onChange={handleTenantChange}
                            className="w-full px-3 py-2.5 rounded-xl font-bold text-[13px] outline-none cursor-pointer transition-colors pdy-sb-select"
                            style={activeTenantId ? { background: 'var(--sb-active)', borderColor: 'var(--sb-accent)', color: 'var(--sb-text)' } : {}}
                        >
                            <option value="null">🌐 TÜM SİSTEM</option>
                            {availableTenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name?.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                )}

                {!isDesktopSidebarCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider mb-1.5 px-0.5" style={{ color: 'var(--sb-muted)' }}>Operasyonel Şube</span>
                        <select
                            disabled={(hasPermission('branch_isolation') && !isSystemAdmin) || (isPlatformAdmin && !activeTenantId && branches.length === 0)}
                            value={activeBranchName}
                            onChange={handleBranchChange}
                            className="w-full px-3 py-2.5 rounded-[14px] font-semibold text-[13px] outline-none cursor-pointer transition-colors pdy-sb-select"
                        >
                            {branches.length > 0 ? (
                                branches.map(b => (
                                    <option key={b.id} value={b.name}>
                                        {b.type === 'Merkez' ? '🏢' : '🔧'} {b.name.toUpperCase()}
                                    </option>
                                ))
                            ) : (
                                <option value="">{activeTenantId ? 'Yükleniyor...' : 'Seçim Yapın'}</option>
                            )}
                        </select>
                    </div>
                )}

                {isDesktopSidebarCollapsed && (
                    <div className="flex justify-center mt-2 group relative">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer pdy-sb-avatar">
                            <Store className="w-5 h-5" />
                        </div>
                    </div>
                )}
            </div>

            {/* SCROLLABLE NAVIGATION */}
            <div className="flex-1 overflow-y-auto px-3 pb-8 custom-scrollbar space-y-5">
                {filteredGroups.map((group, gIdx) => (
                    <div key={gIdx} className="nav-group flex flex-col gap-1">
                        {!isDesktopSidebarCollapsed && (
                            <div className="px-3 mb-1 mt-1 text-[11px] font-bold uppercase tracking-[0.08em] sb-header">
                                {group.group}
                            </div>
                        )}

                        {group.items.map((item) => {
                            const Icon = item.icon;

                            if (item.isParent) {
                                const isOpen = openSections[item.id!];
                                const hasActiveChild = item.subItems!.some(child => pathname === child.href);

                                return (
                                    <div key={item.id} className="flex flex-col relative group/parent">
                                        {/* Parent Trigger */}
                                        <button
                                            onClick={() => {
                                                if (isDesktopSidebarCollapsed) {
                                                    // optionally expand sidebar when clicking a parent in collapsed mode
                                                    setIsDesktopSidebarCollapsed(false);
                                                }
                                                toggleSection(item.id!);
                                            }}
                                            className={`sb-item relative flex items-center gap-3 px-3 py-2 rounded-[14px] transition-all duration-200 cursor-pointer overflow-hidden
                                                ${hasActiveChild ? 'sb-active font-semibold' : 'sb-default hover:translate-x-[2px] font-medium'}
                                            `}
                                        >
                                            <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                                                <Icon className={`w-5 h-5 sb-icon ${hasActiveChild ? 'opacity-100' : 'opacity-60 group-hover/parent:opacity-100'}`} strokeWidth={1.5} />
                                            </div>

                                            {!isDesktopSidebarCollapsed && (
                                                <>
                                                    <span className="text-[14px] flex-1 text-left">{item.name}</span>
                                                    <ChevronRight className={`w-4 h-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                                                </>
                                            )}

                                            {isDesktopSidebarCollapsed && hasActiveChild && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-1/2 rounded-r-md" style={{ background: 'var(--sb-accent)' }}></div>
                                            )}
                                        </button>

                                        {/* Children Dropdown */}
                                        <div
                                            className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                ${isOpen && !isDesktopSidebarCollapsed ? 'max-h-[300px] mt-1' : 'max-h-0'}
                                            `}
                                        >
                                            {item.subItems!.map(child => {
                                                const isActive = pathname === child.href;
                                                return (
                                                    <Link key={child.href} href={child.href} className="group/child relative">
                                                        <div className={`sb-item flex items-center mx-2 pl-9 pr-3 py-[7px] rounded-[10px] transition-all duration-200 outline-none
                                                            ${isActive
                                                                ? 'sb-active font-semibold'
                                                                : 'sb-default hover:translate-x-[2px]'}
                                                        `}>
                                                            <span className="text-[13px]">{child.name}</span>

                                                            {/* Dynamic Left Accent for active child */}
                                                            {isActive && (
                                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--sb-accent)' }}></div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            }

                            const isActive = pathname === item.href;

                            return (
                                <Link key={item.href} href={item.href || '#'} className="relative group/link">
                                    <div className={`sb-item flex items-center gap-3 px-3 py-2 rounded-[14px] transition-all duration-200 overflow-hidden
                                        ${isActive ? 'sb-active font-semibold' : 'sb-default hover:translate-x-[2px] font-medium'}
                                    `}>
                                        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                                            <Icon className={`w-5 h-5 sb-icon ${isActive ? 'opacity-100' : 'opacity-60 group-hover/link:opacity-100'}`} strokeWidth={1.5} />
                                        </div>

                                        {!isDesktopSidebarCollapsed && (
                                            <span className="text-[14px] flex-1">{item.name}</span>
                                        )}

                                        {/* Active Left Indicator Bar */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-md" style={{ background: 'var(--sb-accent)' }}></div>
                                        )}

                                        {/* Alerts / Badges */}
                                        {!isDesktopSidebarCollapsed && item.alertCount && item.alertCount > 0 && (
                                            <span className="px-2 py-[2px] rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100">
                                                {item.alertCount}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </div>

            {/* USER PROFILE FOOTER */}
            <div className={`p-4 border-t flex-shrink-0 transition-opacity duration-300 ${isDesktopSidebarCollapsed ? 'items-center flex flex-col' : ''}`} style={{ borderColor: 'var(--sb-border)' }}>
                <div className={`flex items-center ${isDesktopSidebarCollapsed ? 'justify-center mx-auto' : 'gap-3 mb-4'} w-full`}>
                    <div className="w-9 h-9 flex-shrink-0 rounded-[12px] flex items-center justify-center font-bold overflow-hidden shadow-sm pdy-sb-avatar">
                        {displayUser?.name?.charAt(0) || 'U'}
                    </div>

                    {!isDesktopSidebarCollapsed && (
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[13px] font-bold truncate" style={{ color: 'var(--sb-text)' }}>
                                {displayUser?.name}
                            </span>
                            <div className="flex items-center mt-0.5">
                                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded pdy-sb-badge">
                                    {displayUser?.role || 'Kullanıcı'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {!isDesktopSidebarCollapsed && (
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-[10px] transition-colors text-[13px] font-semibold group pdy-sb-logout"
                    >
                        <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                        Çıkış Yap
                    </button>
                )}

                {isDesktopSidebarCollapsed && (
                    <button
                        onClick={logout}
                        className="mt-4 w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors pdy-sb-logout"
                        title="Çıkış Yap"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Injected Micro CSS for Sidebar Surface Typography and Animations */}
            <style jsx>{`
                .pdy-sidebar {
                    --sb-bg: #F8FAFF;
                    --sb-bg2: #F3F6FF;
                    --sb-tint: rgba(37,99,235,0.04);
                    --sb-border: rgba(15,23,42,0.06);
                    --sb-text: #0F172A;
                    --sb-muted: #64748B;
                    --sb-hover: rgba(37,99,235,0.06);
                    --sb-active: rgba(37,99,235,0.10);
                    --sb-accent: #2563EB;

                    background: linear-gradient(180deg, var(--sb-bg) 0%, var(--sb-bg2) 100%);
                    border-right: 1px solid var(--sb-border);
                }

                :global(.dark) .pdy-sidebar {
                    --sb-bg: #0B1220;
                    --sb-bg2: #0E1628;
                    --sb-tint: rgba(96,165,250,0.06);
                    --sb-border: rgba(148,163,184,0.10);
                    --sb-text: #E5E7EB;
                    --sb-muted: #94A3B8;
                    --sb-hover: rgba(96,165,250,0.08);
                    --sb-active: rgba(96,165,250,0.14);
                    --sb-accent: #60A5FA;

                    background: linear-gradient(180deg, var(--sb-bg) 0%, var(--sb-bg2) 100%);
                    border-right: 1px solid var(--sb-border);
                    box-shadow: inset -1px 0 0 rgba(96,165,250,0.08);
                }

                @supports (backdrop-filter: blur(6px)) {
                    :global(.dark) .pdy-sidebar {
                        background: linear-gradient(180deg, rgba(11,18,32,0.6) 0%, rgba(14,22,40,0.85) 100%);
                        backdrop-filter: blur(6px);
                    }
                }

                .pdy-sb-collapse-btn {
                    color: var(--sb-muted);
                }
                .pdy-sb-collapse-btn:hover {
                    color: var(--sb-text);
                    background: var(--sb-hover);
                }

                .pdy-sb-select {
                    background: transparent;
                    border: 1px solid var(--sb-border);
                    color: var(--sb-text);
                }
                .pdy-sb-select:hover {
                    background: var(--sb-hover);
                }
                .pdy-sb-select option {
                    background: var(--sb-bg);
                    color: var(--sb-text);
                }

                .pdy-sb-avatar {
                    background: var(--sb-hover);
                    color: var(--sb-text);
                    border: 1px solid var(--sb-border);
                }

                .pdy-sb-badge {
                    background: var(--sb-hover);
                    color: var(--sb-muted);
                }

                .pdy-sb-logout {
                    color: var(--sb-muted);
                }
                .pdy-sb-logout:hover {
                    color: #EF4444;       
                    background: rgba(239, 68, 68, 0.08);
                }

                .sb-header {
                    color: var(--sb-muted);
                }

                .sb-item.sb-default {
                    color: var(--sb-muted);
                }
                .sb-item.sb-default:hover {
                    background: var(--sb-hover);
                    color: var(--sb-text);
                }
                .sb-item.sb-active {
                    background: var(--sb-active);
                    color: var(--sb-text);
                }
                .sb-item.sb-active .sb-icon {
                    color: var(--sb-accent);
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(15, 23, 42, 0.12);
                    border-radius: 10px;
                }
                :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.18);
                }
                :global(.dark) .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.25);
                }
            `}</style>
        </aside>
    );
}
