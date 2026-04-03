/**
 * Mobile Navigation Component
 * Bottom navigation bar for mobile devices
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useResponsive';
import { 
    Route, TrendingUp, Building2, LayoutGrid, UserCircle2, 
    Receipt, History, BarChart3, Users, Settings, Wrench, 
    CheckSquare, CalendarDays, Bell
} from 'lucide-react';
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
    const { user } = useAuth();

    if (!isMobile) return null;

    let navItems: NavItem[] = [];
    const role = user?.role?.toUpperCase() || '';

    if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'ADMIN') {
        navItems = [
            { path: '/desktop', icon: <LayoutGrid className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Özet' },
            { path: '/reports/ceo', icon: <BarChart3 className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Rapor' },
            { path: '/staff', icon: <Users className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Ekip' },
            { path: '/settings', icon: <Settings className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Ayar' },
            { path: '/staff/me', icon: <UserCircle2 className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Profil' }
        ];
    } else if (role.includes('SAHA')) {
        navItems = [
            { path: '/field-mobile/routes', icon: <Route className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Rota' },
            { path: '/field-mobile/intelligence', icon: <TrendingUp className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'SalesX' },
            { path: '/field-mobile/customers', icon: <Building2 className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Cari' },
            { path: '/calendar', icon: <CalendarDays className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Takvim' },
            { path: '/staff/me', icon: <UserCircle2 className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Profil' }
        ];
    } else if (role.includes('SERVIS') || role.includes('TEKNISYEN') || role.includes('SERVICE')) {
        navItems = [
            { path: '/calendar', icon: <CalendarDays className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Ajanda' },
            { path: '/service', icon: <Wrench className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Servis' },
            { path: '/tasks', icon: <CheckSquare className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'İşlem' },
            { path: '/staff/me', icon: <UserCircle2 className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Profil' }
        ];
    } else {
        navItems = [
            { path: '/staff/me', icon: <UserCircle2 className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Portal' },
            { path: '/calendar', icon: <CalendarDays className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Takvim' },
            { path: '/tasks', icon: <CheckSquare className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Görev' },
            { path: '/notifications', icon: <Bell className="w-[20px] h-[20px] mb-1" strokeWidth={2} />, label: 'Bildirim' }
        ];
    }

    return (
        <nav
            className="md:hidden bg-white/90 dark:bg-[#0b0f19]/90 border-t border-slate-200 dark:border-white/5 backdrop-blur-xl"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-evenly',
                paddingBottom: 'env(safe-area-inset-bottom)',
                zIndex: 1000,
                height: '64px',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
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
                            color: isActive ? '#4f46e5' : '#64748b',
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
