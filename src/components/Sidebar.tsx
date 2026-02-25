"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";


export default function Sidebar() {
    const pathname = usePathname();
    const { user: authUser, logout } = useAuth();
    const {
        currentUser, hasPermission, hasFeature, subscription,
        branches, activeBranchName, setActiveBranchName,
        suspiciousEvents, isSidebarOpen, setIsSidebarOpen,
        isInitialLoading,
        activeTenantId, setActiveTenantId, availableTenants
    } = useApp();

    const [fieldSalesOpen, setFieldSalesOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [networkOpen, setNetworkOpen] = useState(false);

    // Auto-expand if active
    useEffect(() => {
        if (pathname.includes('/field-sales')) {
            setFieldSalesOpen(true);
        }
        if (pathname.includes('/reports')) {
            setReportsOpen(true);
        }
        if (pathname.includes('/network') || pathname.includes('/admin/ops')) {
            setNetworkOpen(true);
        }
    }, [pathname]);

    const isSystemAdmin = currentUser === null || currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));
    const isPlatformAdmin = authUser?.tenantId === 'PLATFORM_ADMIN' || authUser?.role === 'SUPER_ADMIN' || authUser?.role === 'SUPPORT_AGENT';
    const isAuditor = currentUser?.role === 'AUDITOR';
    const displayUser = currentUser || authUser;

    // UI mapping for permissions
    const permMap: Record<string, { perm?: string, feature?: string }> = {
        '/': { perm: 'pos_access', feature: 'pos' },
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
        '/staff/me': { perm: 'pos_access' }, // Herkes erişebilir genelde POS yetkisi olanlar
        '/fintech/control-tower': { perm: 'finance_view', feature: 'fintech_tower' },
        '/fintech/profitability-heatmap': { perm: 'finance_view', feature: 'pnl_heatmap' },
        '/fintech/open-banking': { perm: 'finance_view' },
        '/fintech/smart-pricing': { perm: 'finance_view', feature: 'smart_pricing' },
        '/notifications': { perm: 'pos_access' },
        '/network/buyer/orders': { perm: 'supplier_view' },
        '/network/seller/orders': { perm: 'sales_archive' },
    };

    const menuItems = [
        { name: 'POS Terminal', href: '/', icon: '🏮' },
        { name: 'Personel Paneli', href: '/staff/me', icon: '👤' },

        // FINANSAL YÖNETİM GRUBU
        { name: 'Finansal Yönetim', href: '/accounting', icon: '🏛️' },
        { name: 'Satış Yönetimi', href: '/sales', icon: '🧾' },
        { name: 'Cari Hesaplar', href: '/customers', icon: '🤝' },
        { name: 'Tedarikçi Ağı', href: '/suppliers', icon: '🚚' },

        // B2B AĞI & PAZARYERİ
        {
            name: 'B2B & Pazaryeri Ağı',
            icon: '🌍',
            isParent: true,
            id: 'network-parent',
            subItems: [
                { name: 'B2B Ürün Kataloğu', href: '/catalog', icon: '🛍️' },
                { name: '🛒 Sepetim (Cart)', href: '/catalog/cart', icon: '🛒' },
                { name: 'Pazarlıklı Alımlar (Buyer)', href: '/rfq', icon: '🤝' },
                { name: 'Sözleşmelerim (Buyer)', href: '/contracts', icon: '📜' },
                { name: 'Ürün Yayınlama (Seller)', href: '/seller/products', icon: '📢' },
                { name: 'Gelen Talepler (Seller)', href: '/seller/rfqs', icon: '📈' },
                { name: 'Tedarik Sözleşmeleri (Seller)', href: '/seller/contracts', icon: '🤝' },
                { name: 'Alınan Siparişler (Seller)', href: '/network/seller/orders', icon: '🏪' },
                { name: 'Verilen Siparişler (Buyer)', href: '/network/buyer/orders', icon: '🛒' },
                { name: 'ADMIN: Kategoriler', href: '/admin/catalog/categories', icon: '📂' },
                { name: 'ADMIN: Onay Masası', href: '/admin/products', icon: '⚖️' },
                { name: 'ADMIN: Firmalar', href: '/admin/companies', icon: '🏢' },
                { name: 'ADMIN: Altyapı', href: '/admin/ops/providers', icon: '⚙️' }
            ]
        },

        // AKILLI SİSTEMLER GRUBU
        { name: 'Finansal Kontrol Kulesi', href: '/fintech/control-tower', icon: '🗼' },

        // OPERASYON GRUBU
        { name: 'Envanter & Depo', href: '/inventory', icon: '📥' },
        {
            name: 'Saha Satış Yönetimi',
            icon: '🗺️',
            isParent: true,
            id: 'field-sales-parent',
            subItems: [
                { name: 'Yönetim Paneli', href: '/field-sales/admin/routes', icon: '⚙️' },
                { name: 'Saha Satış Paneli', href: '/field-sales', icon: '📍' },
                { name: 'Canlı Saha Takibi', href: '/field-sales/admin/live', icon: '🛰️' },
            ]
        },
        { name: 'Teklifler', href: '/quotes', icon: '📋' },
        { name: 'Servis Masası', href: '/service', icon: '🛠️' },

        // ANALİZ & DENETİM
        {
            name: 'İş Zekası & Analiz',
            icon: '🧠',
            isParent: true,
            id: 'reports-parent',
            subItems: [
                { name: 'İş Zekası (CEO)', href: '/reports/ceo', icon: '🧠' },
                { name: 'Veri Analizi', href: '/reports', icon: '📊' },
            ]
        },
        { name: 'PDKS Yönetimi', href: '/staff/pdks', icon: '🛡️' },
        { name: 'Denetim Kayıtları', href: '/admin/audit-logs', icon: '🔍' },
        { name: 'Kaçak Satış Tespit', href: '/security/suspicious', icon: '🚨' },

        // SİSTEM & AYARLAR
        { name: 'Mali Müşavir', href: '/advisor', icon: '💼' },
        { name: 'Sistem Ayarları', href: '/settings', icon: '⚙️' },
        { name: 'Ekip & Yetki', href: '/staff', icon: '👥' },
        { name: 'Abonelik & Planlar', href: '/billing', icon: '💎' },
        { name: 'Yardım & Kılavuz', href: '/help', icon: '❓' },
        ...(isPlatformAdmin ? [
            { name: 'Destek Masası (Inbox)', href: '/admin/support/tickets', icon: '📥' },
            { name: 'Bilgi Bankası Yönetimi', href: '/admin/tenants/PLATFORM_ADMIN/help', icon: '📚' }
        ] : []),
    ].filter(item => {
        const config = permMap[item.href];
        if (!config) return true; // default public items

        // Auditor specific logic
        if (isAuditor) {
            return ['/admin/audit-logs', '/reports', '/advisor'].includes(item.href);
        }

        // 1. Feature Check (Subscription Plan)
        if (config.feature && !hasFeature(config.feature)) {
            return false;
        }

        // 2. Admin users bypass permissions (but NOT features)
        if (isSystemAdmin) return true;

        // 3. Permission Check (User Role)
        if (config.perm) {
            return hasPermission(config.perm);
        }

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

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveBranchName(e.target.value);
    };

    const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveTenantId(e.target.value === 'null' ? null : e.target.value);
    };

    if (!displayUser) return null;

    return (
        <aside
            className={`sidebar-fixed ${isSidebarOpen ? 'active' : ''}`}
            style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(30px) saturate(150%)',
                borderRight: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 2000,
                overflow: 'hidden',
                fontFamily: "'Outfit', sans-serif",
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
            }}>
            {/* MOBILE CLOSE BUTTON */}
            <button
                className="show-mobile"
                onClick={() => setIsSidebarOpen(false)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-light)',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    zIndex: 2001,
                    cursor: 'pointer'
                }}
            >
                ✕
            </button>

            {/* LOGO & SELECTORS */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ padding: '32px 24px 20px 24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '4px' }}>
                        PERIOD<span style={{ color: 'var(--primary)', opacity: 0.9 }}>YA</span>
                    </h1>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2px', opacity: 0.6 }}>SYSTEM V3.0</div>
                </div>

                <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* TENANT SELECTOR (IMPERSONATION) */}
                    {isPlatformAdmin && (
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Hangi Şirket?</div>
                            <select
                                value={activeTenantId || 'null'}
                                onChange={handleTenantChange}
                                style={{
                                    width: '100%', padding: '12px 14px',
                                    background: activeTenantId ? 'rgba(255, 85, 0, 0.1)' : 'var(--bg-hover)',
                                    border: activeTenantId ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                                    borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', outline: 'none',
                                    fontSize: '13px', fontWeight: '700', transition: '0.3s'
                                }}>
                                <option value="null">🏢 TÜM SİSTEM</option>
                                {availableTenants.map(t => (
                                    <option key={t.id} value={t.id}>
                                        👥 {t.name?.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* BRANCH SELECTOR */}
                    <div>
                        <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Operasyonel Şube</div>
                        <select
                            disabled={(hasPermission('branch_isolation') && !isSystemAdmin) || (isPlatformAdmin && !activeTenantId && branches.length === 0)}
                            value={activeBranchName}
                            onChange={handleBranchChange}
                            style={{
                                width: '100%', padding: '12px 14px',
                                background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
                                borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', outline: 'none',
                                fontSize: '13px', fontWeight: '700', transition: '0.3s'
                            }}>
                            {branches.length > 0 ? (
                                branches.map(b => (
                                    <option key={b.id} value={b.name}>
                                        {b.type === 'Merkez' ? '🏢' : '🔧'} {b.name.toUpperCase()}
                                    </option>
                                ))
                            ) : (
                                <option value="">{activeTenantId ? 'ŞUBE YÜKLENİYOR...' : 'ÖNCE ŞİRKET SEÇİN'}</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* Menu Links */}
            <nav className="sidebar-scroll" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '0 16px 20px 16px',
                flex: 1,
                overflowY: 'auto'
            }}>
                {menuItems.map((item: any) => {
                    if (item.isParent) {
                        const isExpanded = item.id === 'field-sales-parent' ? fieldSalesOpen : (item.id === 'reports-parent' ? reportsOpen : (item.id === 'network-parent' ? networkOpen : false));
                        const anyChildActive = item.subItems?.some((sub: any) => pathname === sub.href);

                        return (
                            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div
                                    onClick={() => {
                                        if (item.id === 'field-sales-parent') setFieldSalesOpen(!fieldSalesOpen);
                                        if (item.id === 'reports-parent') setReportsOpen(!reportsOpen);
                                        if (item.id === 'network-parent') setNetworkOpen(!networkOpen);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '12px 18px', borderRadius: '14px',
                                        background: anyChildActive ? 'rgba(255, 85, 0, 0.05)' : 'transparent',
                                        color: anyChildActive ? 'var(--primary)' : 'var(--text-muted)',
                                        transition: '0.3s', cursor: 'pointer',
                                        fontWeight: '800',
                                        border: anyChildActive ? '1px solid rgba(255, 85, 0, 0.1)' : '1px solid transparent'
                                    }}
                                    className="sidebar-link"
                                >
                                    <span style={{ fontSize: '18px', filter: anyChildActive ? 'none' : 'grayscale(100%) opacity(0.5)' }}>{item.icon}</span>
                                    <span style={{ fontSize: '14px', letterSpacing: '0.1px', flex: 1 }}>{item.name}</span>
                                    <span style={{ fontSize: '10px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
                                </div>

                                {isExpanded && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '12px', borderLeft: '2px solid var(--border-light)', marginLeft: '26px', marginTop: '4px', marginBottom: '8px' }}>
                                        {item.subItems.map((sub: any) => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link key={sub.href} href={sub.href} style={{ textDecoration: 'none' }}>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '10px 14px', borderRadius: '10px',
                                                        background: isSubActive ? 'var(--primary)' : 'transparent',
                                                        color: isSubActive ? 'white' : 'var(--text-muted)',
                                                        transition: '0.2s',
                                                        fontWeight: '700',
                                                        fontSize: '13px'
                                                    }}
                                                        className="sidebar-sublink"
                                                    >
                                                        <span>{sub.icon}</span>
                                                        <span>{sub.name}</span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '12px 18px', borderRadius: '14px',
                                background: isActive ? '#FF5500' : 'transparent',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
                                fontWeight: '700',
                                boxShadow: isActive ? '0 10px 20px -10px rgba(255, 85, 0, 0.4)' : 'none'
                            }}
                                className="sidebar-link"
                            >
                                <span style={{ fontSize: '18px', filter: isActive ? 'none' : 'grayscale(100%) opacity(0.5)' }}>{item.icon}</span>
                                <span style={{ fontSize: '14px', letterSpacing: '0.1px', flex: 1 }}>{item.name}</span>
                                {item.href === '/security/suspicious' && suspiciousEvents.length > 0 && (
                                    <span style={{
                                        background: '#FF416C',
                                        color: 'white',
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontWeight: '900',
                                        boxShadow: '0 0 10px rgba(255, 65, 108, 0.4)'
                                    }}>
                                        {suspiciousEvents.length}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* USER CARD (Fixed Bottom) */}
            <div style={{
                flexShrink: 0,
                padding: '24px',
                borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-hover)'
            }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '14px',
                        background: (displayUser.role?.includes('Admin') || currentUser === null) ? 'var(--primary)' : 'var(--success)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                        boxShadow: 'var(--shadow-premium)'
                    }}>
                        {(displayUser.role?.includes('Admin') || currentUser === null) ? '⚡' : '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {displayUser.name}
                            {hasPermission('settings_manage') && (
                                <Link href="/settings" title="Ayarlar" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '14px', marginLeft: '5px' }}>
                                    ⚙️
                                </Link>
                            )}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{displayUser.role || 'Personel'}</div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    style={{
                        width: '100%', padding: '12px',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px', color: '#FF4444',
                        fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: '0.3s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = '#FF4444';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#FF4444';
                    }}
                >
                    🔚 Çıkış Yap
                </button>

            </div>

            <style jsx>{`
                .sidebar-link:not(.active):hover {
                    background: var(--bg-hover);
                    color: var(--text-main) !important;
                    transform: translateX(5px);
                }
                .sidebar-link:not(.active):hover span:first-child {
                    filter: none !important;
                }
                
                /* Tematik İnce Scrollbar */
                .sidebar-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .sidebar-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb {
                    background: var(--border-rich);
                    border-radius: 10px;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: var(--text-muted);
                }
            `}</style>
        </aside>
    );
}
