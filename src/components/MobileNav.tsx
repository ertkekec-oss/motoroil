/**
 * Mobile Navigation Component
 * Bottom navigation bar for mobile devices
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useResponsive';
import { Route, TrendingUp, Building2, LayoutGrid, UserCircle2, Receipt, History } from 'lucide-react';
import Link from 'next/link';

interface NavItem {
    icon: any;
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
        { path: '/field-mobile/routes', icon: <Route className="w-[18px] h-[18px] mb-1" strokeWidth={2.5} />, label: 'Rotalarım' },
        { path: '/field-mobile/intelligence', icon: <TrendingUp className="w-[18px] h-[18px] mb-1" strokeWidth={2.5} />, label: 'SalesX' },
        { path: '/field-mobile/customers', icon: <Building2 className="w-[18px] h-[18px] mb-1" strokeWidth={2.5} />, label: 'Müşteriler' },
        { path: '/field-mobile/visits', icon: <History className="w-[18px] h-[18px] mb-1" strokeWidth={2.5} />, label: 'Ziyaretler' },
        { path: '/field-mobile/expenses', icon: <Receipt className="w-[18px] h-[18px] mb-1" strokeWidth={2.5} />, label: 'Masraflar' },
        { path: '/staff/me', icon: <LayoutGrid className="w-[18px] h-[18px] mb-1" strokeWidth={2.5} />, label: 'Portal' },
    ];

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#0b0f19', // More corporate, serious dark theme matching Enterprise Profile
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-evenly',
                paddingBottom: 'env(safe-area-inset-bottom)',
                zIndex: 1000,
                height: '64px',
                boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
            }}
        >
            {navItems.map((item) => {
                const isActive = pathname === item.path || (item.path !== '/staff/me' && pathname.startsWith(item.path));
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: isActive ? '#3b82f6' : '#64748b',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: isActive ? 1 : 0.7,
                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}
                    >
                        {item.icon}
                        <span style={{ 
                            fontSize: '9px', 
                            fontWeight: '900', 
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            marginTop: '2px'
                        }}>
                            {item.label}
                        </span>
                        {item.badge && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '10px',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '9px',
                                    fontWeight: '900',
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
