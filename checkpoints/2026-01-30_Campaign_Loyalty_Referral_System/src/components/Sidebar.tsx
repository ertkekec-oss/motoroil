"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";

export default function Sidebar() {
    const pathname = usePathname();
    const { user: authUser, logout } = useAuth();
    const { currentUser, hasPermission, branches, activeBranchName, setActiveBranchName } = useApp();
    const isSystemAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));
    const displayUser = currentUser || authUser;

    // ... menuItems and logic ...

    // UI mapping for permissions
    const permMap: Record<string, string> = {
        '/accounting': 'finance_view',
        '/customers': 'customer_view',
        '/suppliers': 'supplier_view',
        '/inventory': 'inventory_view',
        '/staff': 'staff_manage',
        '/reports': 'reports_view',
        '/security/suspicious': 'security_access',
        '/integrations': 'settings_manage',
        '/settings/branch': 'settings_manage',
        '/settings': 'staff_manage', // simple mock
    };

    const menuItems = [
        { name: 'POS Terminal', href: '/', icon: '🏮' },
        { name: 'Finansal Yönetim', href: '/accounting', icon: '🏛️' },
        { name: 'Satış Yönetimi', href: '/sales', icon: '🧾' },
        { name: 'Cari Hesaplar', href: '/customers', icon: '🤝' },
        { name: 'Tedarikçi Ağı', href: '/suppliers', icon: '🚚' },
        { name: 'Envanter & Depo', href: '/inventory', icon: '📥' },
        { name: 'Servis Masası', href: '/service', icon: '🛠️' },
        { name: 'Ekip Yönetimi', href: '/staff', icon: '👤' },
        { name: 'Veri Analizi', href: '/reports', icon: '📊' },
        { name: 'Hizmet Özetleri', href: '/reports/daily', icon: '📅' },
        { name: 'Satış Monitörü', href: '/security/suspicious', icon: '🛡️' },
        { name: 'Entegrasyonlar', href: '/integrations', icon: '🔌' },
        { name: 'E-Ticaret', href: '/ecommerce', icon: '🌍' },
        { name: 'Şube Ayarları', href: '/settings/branch', icon: '🏢' },
        { name: 'Sistem Ayarları', href: '/settings', icon: '⚙️' },
    ].filter(item => {
        const requiredPerm = permMap[item.href];
        if (!requiredPerm) return true; // default public items
        return hasPermission(requiredPerm);
    });

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActiveBranchName(e.target.value);
    };

    if (!displayUser) return null;

    return (
        <aside style={{
            width: '240px',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(30px) saturate(150%)',
            borderRight: '1px solid var(--border-light)',
            position: 'fixed',
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            overflow: 'hidden',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* LOGO & BRANCH */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ padding: '32px 24px 20px 24px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '4px' }}>
                        MOTOR<span style={{ color: 'var(--primary)', opacity: 0.9 }}>OIL</span>
                    </h1>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2px', opacity: 0.6 }}>SYSTEM V3.0</div>
                </div>

                <div style={{ padding: '0 24px 24px 24px' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>Operasyonel Şube</div>
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
                        {isSystemAdmin && <option value="Tümü">🌐 TÜM ŞUBELER</option>}
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
                                <span style={{ fontSize: '14px', letterSpacing: '0.1px' }}>{item.name}</span>
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
                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
                    }}>
                        {(displayUser.role?.includes('Admin') || currentUser === null) ? '⚡' : '👤'}
                    </div>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>{displayUser.name}</div>
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
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </aside>
    );
}
