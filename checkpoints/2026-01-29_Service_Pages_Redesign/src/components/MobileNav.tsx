/**
 * Mobile Navigation Component
 * Bottom navigation bar for mobile devices
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useResponsive';

interface NavItem {
    icon: string;
    label: string;
    path: string;
    badge?: number;
}

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const isMobile = useIsMobile();

    if (!isMobile) return null;

    const navItems: NavItem[] = [
        { icon: '🏠', label: 'Ana Sayfa', path: '/' },
        { icon: '📦', label: 'Stok', path: '/inventory' },
        { icon: '💰', label: 'Satış', path: '/pos' },
        { icon: '👥', label: 'Müşteri', path: '/customers' },
        { icon: '📊', label: 'Rapor', path: '/reports' },
    ];

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
                padding: '8px 0',
                zIndex: 1000,
                boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
            }}
        >
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 4px',
                            background: 'transparent',
                            border: 'none',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500' }}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '8px',
                                    background: 'var(--danger)',
                                    color: 'white',
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    padding: '2px 5px',
                                    borderRadius: '10px',
                                    minWidth: '16px',
                                    textAlign: 'center',
                                }}
                            >
                                {item.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
