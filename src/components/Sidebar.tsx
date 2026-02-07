"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import NotificationCenter from "./NotificationCenter";

export default function Sidebar() {
    const pathname = usePathname();
    const { user: authUser, logout } = useAuth();
    const {
        currentUser, hasPermission, hasFeature, subscription,
        branches, activeBranchName, setActiveBranchName,
        suspiciousEvents, isSidebarOpen, setIsSidebarOpen
    } = useApp();

    const isSystemAdmin = currentUser === null || currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));
    const displayUser = currentUser || authUser;

    // ... menuItems and logic ...

    // UI mapping for permissions
    const permMap: Record<string, { perm?: string, feature?: string }> = {
        '/': { perm: 'pos_access', feature: 'pos' },
        '/accounting': { perm: 'finance_view', feature: 'accounting' },
        '/customers': { perm: 'customer_view', feature: 'crm' },
        '/suppliers': { perm: 'supplier_view', feature: 'crm' },
        '/inventory': { perm: 'inventory_view', feature: 'inventory' },
        '/service': { perm: 'service_view', feature: 'service' },
        '/sales': { perm: 'sales_archive', feature: 'sales' },
        '/reports': { perm: 'reports_view', feature: 'reporting' },
        '/reports/daily': { perm: 'reports_view', feature: 'reporting' },
        '/reports/suppliers': { perm: 'reports_view', feature: 'reporting' },
        '/integrations': { perm: 'settings_manage', feature: 'e_invoice' }, // E-invoice is an integration
        '/settings/branch': { perm: 'settings_manage' },
        '/settings': { perm: 'settings_manage' },
        '/staff': { perm: 'staff_manage' },
        '/advisor': { perm: 'finance_view', feature: 'accounting' },
    };

    const menuItems = [
        { name: 'POS Terminal', href: '/', icon: '🏮' },
        { name: 'Finansal Yönetim', href: '/accounting', icon: '🏛️' },
        { name: 'Satış Yönetimi', href: '/sales', icon: '🧾' },
        { name: 'Teklifler', href: '/quotes', icon: '📋' },
        { name: 'Cari Hesaplar', href: '/customers', icon: '🤝' },
        { name: 'Tedarikçi Ağı', href: '/suppliers', icon: '🚚' },
        { name: 'Envanter & Depo', href: '/inventory', icon: '📥' },
        { name: 'Servis Masası', href: '/service', icon: '🛠️' },
        { name: 'Veri Analizi', href: '/reports', icon: '📊' },
        { name: 'Kaçak Satış Tespit', href: '/security/suspicious', icon: '🚨' },
        { name: 'Mali Müşavir', href: '/advisor', icon: '💼' },
        { name: 'Sistem Ayarları', href: '/settings', icon: '⚙️' },
        { name: 'Ekip & Yetki', href: '/staff', icon: '👥' },
        { name: 'Abonelik & Planlar', href: '/billing', icon: '💎' },
        { name: 'Yardım & Kılavuz', href: '/help', icon: '❓' },
    ].filter(item => {
        const config = permMap[item.href];
        if (!config) return true; // default public items

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
    });

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveBranchName(e.target.value);
    };

    if (!displayUser) return null;

    return (
        <aside
            className={`sidebar-fixed ${isSidebarOpen ? 'active' : ''}`}
            style={{
                width: '240px',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(30px) saturate(150%)',
                borderRight: '1px solid var(--border-light)',
                position: 'fixed',
                top: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 2000,
                overflow: 'hidden',
                fontFamily: "'Outfit', sans-serif",
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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

            {/* LOGO & BRANCH */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ padding: '32px 24px 20px 24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '4px' }}>
                        PERIOD<span style={{ color: 'var(--primary)', opacity: 0.9 }}>YA</span>
                    </h1>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2px', opacity: 0.6 }}>SYSTEM V3.0</div>
                </div>

                <div style={{ padding: '0 24px 24px 24px' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Operasyonel Şube</div>
                    <select
                        disabled={hasPermission('branch_isolation') && !isSystemAdmin}
                        value={activeBranchName}
                        onChange={handleBranchChange}
                        style={{
                            width: '100%', padding: '12px 14px',
                            background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
                            borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', outline: 'none',
                            fontSize: '13px', fontWeight: '700', transition: '0.3s'
                        }}>
                        {branches.map(b => (
                            <option key={b.id} value={b.name}>
                                {b.type === 'Merkez' ? '🏢' : '🔧'} {b.name.toUpperCase()}
                            </option>
                        ))}
                    </select>
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
                {menuItems.map((item) => {
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)' }}>BİLDİRİMLER</div>
                    <NotificationCenter />
                </div>
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
