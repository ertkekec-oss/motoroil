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
    ChevronDown, ChevronRight, Store, Inbox, Library, LogOut, HelpCircle, LayoutDashboard, UploadCloud, PenTool, Gift, Plug
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

    // Kullanıcı sayfa değiştirdiğinde, sadece aktif olan menü açık kalır, diğerleri kapanır.
    useEffect(() => {
        const expandMap: Record<string, string[]> = {
            'b2b-global-parent': [
                '/support/tickets', '/hub/orders', '/hub/seller/orders', '/hub/buyer/orders',
                '/seller/products', '/catalog', '/catalog/cart', '/seller/categories', '/hub/finance', '/hub/finance/dashboard', '/hub/trust-score',
                '/seller/boost', '/seller/boost/analytics', '/rfq', '/seller/rfqs', '/contracts', '/hub/buyer',
                '/hub-dashboard'
            ],
            'dealer-network-parent': [
                '/dealer-network/dealers', '/dealer-network/catalog',
                '/dealer-network/orders/approvals', '/dealer-network/refunds',
                '/dealer-network/settings', '/dealer-network/banners'
            ],
            'customers-parent': ['/customers', '/suppliers'],
            'signatures-parent': ['/signatures', '/signatures/envelopes', '/signatures/new', '/signatures/templates', '/signatures/inbox', '/signatures/completed'],
            'reconciliation-parent': ['/reconciliation', '/reconciliation/list', '/reconciliation/new', '/reconciliation/disputes'],
            'field-sales-parent': ['/field-sales', '/field-sales/admin/routes', '/field-sales/admin/live', '/field-sales/intelligence'],
            'reports-parent': ['/reports', '/reports/ceo', '/reports/daily', '/reports/suppliers'],
            'campaigns-parent': ['/campaigns', '/campaigns/create', '/campaigns/active', '/campaigns/scheduled', '/campaigns/history', '/campaigns/analytics'],
            'sales-parent': ['/sales', '/sales/revenue-intelligence'],
            'inventory-parent': ['/inventory', '/inventory/warehouses', '/inventory/manufacturing', '/inventory/boms'],
            'service-parent': ['/service', '/service/work-orders', '/service/new'],
            'staff-parent': ['/staff', '/staff/performance']
        };

        setOpenSections(prev => {
            const newOpenState = { ...prev };

            Object.entries(expandMap).forEach(([id, paths]) => {
                // Eğer pathname (aktif sayfa) bu grubun alt sayfalarından biriyse açık bırak, değilse tamemen kapat.
                const isActive = paths.some(p => pathname === p || pathname.startsWith(p + '/'));
                newOpenState[id] = isActive;
            });

            return newOpenState;
        });
    }, [pathname]);

    const isSystemAdmin = currentUser === null || currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));
    const isPlatformAdmin = authUser?.tenantId === 'PLATFORM_ADMIN' || authUser?.role === 'SUPER_ADMIN' || authUser?.role === 'SUPPORT_AGENT';
    const isAuditor = currentUser?.role === 'AUDITOR';
    const displayUser = currentUser || authUser;

    const checkPerm = (permCode: string) => isSystemAdmin || hasPermission(permCode);
    const checkFeature = (featCode: string) => hasFeature(featCode);

    // @ts-ignore
    const isBuyer = isSystemAdmin || hasPermission('supplier_view') || currentUser?.type === 'buying';
    // @ts-ignore
    const isSeller = isSystemAdmin || hasPermission('sales_archive') || currentUser?.type === 'selling';

    const buildMenu = ({
        isSystemAdmin,
        isPlatformAdmin,
        isAuditor,
        checkPerm,
        checkFeature,
        isBuyer,
        isSeller,
        suspiciousEventsCount
    }: any) => {
        const permMap: Record<string, { perm?: string, feature?: string, platformOnly?: boolean, customCheck?: () => boolean }> = {
            '/': { perm: 'pos_access', feature: 'pos' },
            '/terminal': { perm: 'pos_access', feature: 'pos' },
            '/accounting': { perm: 'finance_view', feature: 'financials' },
            '/customers': { perm: 'customer_view', feature: 'current_accounts' },
            '/suppliers': { perm: 'supplier_view', feature: 'suppliers' },
            '/inventory': { perm: 'inventory_view', feature: 'inventory' },

            '/sales': { perm: 'sales_archive', feature: 'sales' },
            '/sales/revenue-intelligence': { perm: 'sales_archive', feature: 'sales' },
            '/campaigns': { perm: 'settings_manage', feature: 'sales' },
            '/field-sales': { perm: 'field_sales_access', feature: 'field_sales' },
            '/field-sales/intelligence': { perm: 'field_sales_access', feature: 'field_sales' },
            '/field-sales/admin/live': { perm: 'field_sales_admin', feature: 'field_sales' },
            '/field-sales/admin/routes': { perm: 'field_sales_admin', feature: 'field_sales' },
            '/offers': { perm: 'offer_create', feature: 'quotes' },
            '/reports': { perm: 'reports_view', feature: 'analytics' },
            '/reports/ceo': { perm: 'reports_view', feature: 'ceo_intel' },
            '/reports/daily': { perm: 'reports_view', feature: 'analytics' },
            '/reports/suppliers': { perm: 'reports_view', feature: 'analytics' },
            '/integrations': { perm: 'settings_manage', feature: 'e_invoice' },
            '/settings/branch': { perm: 'settings_manage' },
            '/settings': { perm: 'settings_manage' },
            '/settings/pricing': { perm: 'settings_manage' },
            '/staff': { perm: 'staff_manage', feature: 'team_management' },
            '/staff/performance': { perm: 'staff_manage', feature: 'team_management' },
            '/advisor': { perm: 'finance_view', feature: 'accountant' },
            '/admin/audit-logs': { perm: 'audit_view', platformOnly: true },
            '/staff/pdks': { perm: 'staff_manage' },
            '/hub-dashboard': { perm: 'b2b_manage' },
            '/dealer-network/dealers': { perm: 'b2b_manage' },
            '/dealer-network/orders/approvals': { perm: 'b2b_manage' },
            '/dealer-network/refunds': { perm: 'b2b_manage' },
            '/dealer-network/settings': { perm: 'b2b_manage' },
            '/dealer-network/banners': { perm: 'b2b_manage' },
            '/admin/b2b/dealer-orders': { platformOnly: true },
            '/admin/b2b/refunds': { platformOnly: true },
            '/admin/b2b/policies': { platformOnly: true },
            '/security/suspicious': { perm: 'security_access' },
            '/billing': { perm: 'settings_manage' },
            '/field-mobile/routes': { perm: 'field_sales_access' },
            '/staff/me': { perm: 'pos_access' },
            '/fintech/control-tower': { perm: 'finance_view', feature: 'fintech_tower' },
            '/fintech/profitability-heatmap': { perm: 'finance_view', feature: 'pnl_heatmap' },
            '/fintech/open-banking': { perm: 'finance_view' },
            '/fintech/smart-pricing': { perm: 'finance_view', feature: 'smart_pricing' },
            '/notifications': { perm: 'pos_access' },
            '/signatures': { perm: 'finance_view' },
            '/signatures/envelopes': { perm: 'finance_view' },
            '/signatures/inbox': { perm: 'finance_view' },
            '/signatures/completed': { perm: 'finance_view' },
            '/reconciliation': { perm: 'finance_view' },
            '/reconciliation/list': { perm: 'finance_view' },
            '/reconciliation/disputes': { perm: 'finance_view' },
            '/hub/buyer/orders': { perm: 'supplier_view' },
            '/hub/seller/orders': { perm: 'sales_archive' },
            '/seller/rfqs': { perm: 'sales_archive' },
        };

        const rawGroups = [
            {
                group: "Workspace",
                items: [
                    { name: 'POS Terminal', href: '/terminal', icon: Terminal },
                    {
                        name: 'Periodya Hub',
                        icon: Globe,
                        isParent: true,
                        id: 'b2b-global-parent',
                        subItems: [
                            { name: 'Hub Paneli', href: '/hub-dashboard' },
                            { name: 'Uyuşmazlık Çözüm Merkezi', href: '/support/tickets' },
                            { name: 'SİPARİŞ & TEKLİF', href: '' },
                            ...((isSeller || isBuyer) ? [
                                { name: 'Ağ Sepetim', href: '/catalog/cart' },
                                { name: 'Talepler & Siparişler', href: '/hub/orders' }
                            ] : []),

                            { name: 'KATALOG', href: '' },
                            ...((isSeller || isBuyer) ? [
                                { name: 'B2B Katalog', href: '/catalog' }
                            ] : []),

                            { name: 'FİNANS & BÜYÜME', href: '' },
                            ...((isSeller || isBuyer) ? [
                                { name: 'Finans & Büyüme (Growth)', href: '/hub/finance/dashboard' }
                            ] : []),

                            ...(isBuyer ? [
                                { name: 'B2B SATINALMA', href: '' },
                                { name: 'RFQ & Sözleşmeler', href: '/rfq' }
                            ] : [])
                        ]
                    },
                    {
                        name: 'Dealer Network',
                        icon: Users,
                        isParent: true,
                        id: 'dealer-network-parent',
                        subItems: [
                            { name: 'Bayiler', href: '/dealer-network/dealers' },
                            { name: 'B2B Katalog', href: '/dealer-network/catalog' },
                            { name: 'Sipariş Onayı', href: '/dealer-network/orders/approvals' },
                            { name: 'İadeler', href: '/dealer-network/refunds' },
                            { name: 'Banner Yönetimi', href: '/dealer-network/banners' },
                            { name: 'Ayarlar', href: '/dealer-network/settings' },
                        ]
                    },
                ]
            },
            {
                group: "Operasyonlar",
                items: [
                    { name: 'Personel Portalı', href: '/staff/me', icon: UserCircle },
                    {
                        name: 'İmzalar',
                        icon: PenTool,
                        isParent: true,
                        id: 'signatures-parent',
                        subItems: [
                            { name: 'İmza Panosu', href: '/signatures' },
                            { name: 'Belge & Zarflar', href: '/signatures/envelopes' },
                            { name: 'Gelen Talepler', href: '/signatures/inbox' },
                            { name: 'Tamamlananlar', href: '/signatures/completed' },
                        ]
                    },
                    {
                        name: 'Mutabakatlar',
                        icon: Handshake,
                        isParent: true,
                        id: 'reconciliation-parent',
                        subItems: [
                            { name: 'Açık Mutabakatlar', href: '/reconciliation' },
                            { name: 'Tüm Mutabakatlar', href: '/reconciliation/list' },
                            { name: 'İtiraz Yönetimi', href: '/reconciliation/disputes' },
                        ]
                    },
                    { name: 'Finansal Yönetim', href: '/accounting', icon: Landmark },
                    {
                        name: 'Satış Yönetimi',
                        icon: Receipt,
                        isParent: true,
                        id: 'sales-parent',
                        subItems: [
                            { name: 'Tüm Satışlar', href: '/sales' },
                            { name: 'Revenue Intelligence', href: '/sales/revenue-intelligence' },
                        ]
                    },
                    {
                        name: 'Cariler',
                        icon: Users,
                        isParent: true,
                        id: 'customers-parent',
                        subItems: [
                            { name: 'Müşteriler', href: '/customers' },
                            { name: 'Tedarikçiler', href: '/suppliers' },
                        ]
                    },
                    {
                        name: 'Envanter',
                        icon: Box,
                        isParent: true,
                        id: 'inventory-parent',
                        subItems: [
                            { name: 'Envanter Genel', href: '/inventory' },
                            { name: 'Depo & Stoklar', href: '/inventory/warehouses' },
                            { name: 'Üretim Kontrol Merkezi', href: '/inventory/manufacturing' },
                        ]
                    },
                    {
                        name: 'Servis Masası',
                        icon: Wrench,
                        isParent: true,
                        id: 'service-parent',
                        subItems: [
                            { name: 'Servis Dashboard', href: '/service' },
                            { name: 'İş Emirleri', href: '/service/work-orders' },
                            { name: 'Yeni İş Emri', href: '/service/new' },
                        ]
                    },
                    { name: 'Teklifler', href: '/offers', icon: FileText },

                    {
                        name: 'SalesX',
                        icon: Map,
                        isParent: true,
                        id: 'field-sales-parent',
                        subItems: [
                            { name: 'Saha Yönetimi', href: '/field-sales/admin/routes' },
                            { name: 'Rota & Müşteri', href: '/field-sales' },
                            { name: 'AI Zeka & Rota', href: '/field-sales/intelligence' },
                            { name: 'Canlı Takip', href: '/field-sales/admin/live' },
                        ]
                    },
                    {
                        name: 'İnsan Kaynakları',
                        icon: Users,
                        isParent: true,
                        id: 'staff-parent',
                        subItems: [
                            { name: 'Personeller', href: '/staff' },
                            { name: 'Performans & Hedef', href: '/staff/performance' },
                        ]
                    },
                    {
                        name: 'Kampanya Engine',
                        icon: Gift,
                        isParent: true,
                        id: 'campaigns-parent',
                        subItems: [
                            { name: 'Dashboard', href: '/campaigns' },
                            { name: 'Yeni Kurgu', href: '/campaigns/create' },
                            { name: 'Aktif Kampanyalar', href: '/campaigns/active' },
                            { name: 'Planlı Kampanyalar', href: '/campaigns/scheduled' },
                            { name: 'Performans', href: '/campaigns/analytics' },
                        ]
                    },
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
                    { name: 'Fintech Tower', href: '/fintech/control-tower', icon: Activity },
                    { name: 'Mali Müşavir', href: '/advisor', icon: Briefcase },
                    { name: 'Anomaliler', href: '/security/suspicious', icon: ShieldAlert, alertCount: suspiciousEventsCount },
                ]
            },

            {
                group: "Sistem",
                items: [
                    { name: 'Gelişmiş İçe Aktar', href: '/data-import', icon: UploadCloud },
                    { name: 'Entegrasyonlar', href: '/integrations', icon: Plug },
                    { name: 'Yardım Merkezi', href: '/help', icon: LifeBuoy },
                    { name: 'Abonelik', href: '/billing', icon: CreditCard },
                    { name: 'Ayarlar', href: '/settings', icon: Settings },
                ]
            }
        ];

        return rawGroups?.map(group => {
            const items = group.items.filter(item => {
                const config = permMap[item.href || ''];
                if (!config && !item.isParent) return true;
                if (isAuditor) {
                    return ['/admin/audit-logs', '/reports', '/advisor'].includes(item.href || '');
                }
                if (config?.platformOnly && !isPlatformAdmin) return false;
                if (config?.feature && !checkFeature(config.feature)) return false;
                if (config?.customCheck && !config.customCheck()) return false;
                if (isSystemAdmin && !config?.platformOnly) return true;
                if (config?.perm) return checkPerm(config.perm);
                return true;
            })?.map((item: any) => {
                if (item.subItems) {
                    return {
                        ...item,
                        subItems: item.subItems.filter((sub: any) => {
                            const subConfig = permMap[sub.href];
                            if (!subConfig) return true;
                            if (subConfig.platformOnly && !isPlatformAdmin) return false;
                            if (subConfig.feature && !checkFeature(subConfig.feature)) return false;
                            if (subConfig.customCheck && !subConfig.customCheck()) return false;
                            if (isSystemAdmin && !subConfig.platformOnly) return true;
                            if (subConfig.perm) return checkPerm(subConfig.perm);
                            return true;
                        })
                    };
                }
                return item;
            });

            const validItems = items.filter((item: any) => {
                if (item.isParent && (!item.subItems || item.subItems.length === 0)) return false;
                return true;
            });

            return { ...group, items: validItems };
        }).filter(g => g.items.length > 0);
    };

    const filteredGroups = buildMenu({
        isSystemAdmin,
        isPlatformAdmin,
        isAuditor,
        checkPerm,
        checkFeature,
        isBuyer,
        isSeller,
        suspiciousEventsCount: suspiciousEvents?.length || 0
    });


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
                            {availableTenants?.map(t => (
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
                            {(!hasPermission('branch_isolation') || isSystemAdmin) && (
                                <option value="all">🌐 TÜM ŞUBELER</option>
                            )}
                            {branches.length > 0 ? (
                                branches?.map(b => (
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
                {filteredGroups?.map((group, gIdx) => (
                    <div key={gIdx} className="nav-group flex flex-col gap-1">
                        {!isDesktopSidebarCollapsed && (
                            <div className="px-3 mb-1 mt-1 text-[11px] font-bold uppercase tracking-[0.08em] sb-header">
                                {group.group}
                            </div>
                        )}

                        {group.items?.map((item) => {
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
                                                ${isOpen && !isDesktopSidebarCollapsed ? 'max-h-[1000px] mt-1' : 'max-h-0'}
                                            `}
                                        >
                                            {item.subItems!.map((child, idx) => {
                                                if (!child.href) {
                                                    return (
                                                        <div key={`header-${idx}`} className="mx-2 mt-3 mb-1 px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                                                            {child.name}
                                                        </div>
                                                    )
                                                }
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
                    --sb-bg: #F8FAFC;
                    --sb-surface: rgba(255,255,255,0.65);
                    --sb-border: rgba(15,23,42,0.06);
                    --sb-text: #0F172A;
                    --sb-muted: #64748B;
                    --sb-hover: rgba(37,99,235,0.06);
                    --sb-active: rgba(37,99,235,0.10);
                    --sb-accent: #2563EB;

                    background: var(--sb-bg);
                    border-right: 1px solid var(--sb-border);
                }

                :global([data-theme="dark"]) .pdy-sidebar {
                    --sb-bg: #0B1220;
                    --sb-bg2: #0E1628;
                    --sb-surface: rgba(15,23,42,0.55);
                    --sb-border: rgba(148,163,184,0.10);
                    --sb-text: rgba(226,232,240,0.95);
                    --sb-muted: rgba(148,163,184,0.90);
                    --sb-hover: rgba(96,165,250,0.10);
                    --sb-active: rgba(96,165,250,0.16);
                    --sb-accent: #60A5FA;

                    background: linear-gradient(180deg, var(--sb-bg) 0%, var(--sb-bg2) 100%);
                    border-right: 1px solid var(--sb-border);
                    box-shadow: inset -1px 0 0 rgba(96,165,250,0.06);
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
                    background: var(--sb-surface);
                    color: var(--sb-text);
                    border: 1px solid var(--sb-border);
                    
                }
                :global([data-theme="dark"]) .pdy-sb-avatar {
                    background: rgba(255,255,255,0.03);
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
                    color: #94A3B8;
                    letter-spacing: 0.08em;
                }
                :global([data-theme="dark"]) .sb-header {
                    color: rgba(148,163,184,0.65);
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
                    font-weight: 600;
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
                :global([data-theme="dark"]) .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.18);
                }
            `}</style>
        </aside>
    );
}
