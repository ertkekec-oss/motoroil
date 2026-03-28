"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useSyncMasterData } from '@/hooks/useSyncMasterData';
import { useSyncUplink } from '@/hooks/useSyncUplink';

import { Route, TrendingUp, Building2, LayoutGrid, UserCircle2, Receipt, History } from 'lucide-react';

export default function FieldMobileLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { sync, syncing } = useSyncMasterData();
    const { uploading } = useSyncUplink();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return <div className="h-screen bg-[#0f111a] flex items-center justify-center text-white">Yükleniyor...</div>;

    const navItems = [
        { href: '/field-mobile/routes', icon: <Route className="w-[20px] h-[20px]" strokeWidth={2} />, label: 'Rotalarım' },
        { href: '/field-mobile/intelligence', icon: <TrendingUp className="w-[20px] h-[20px]" strokeWidth={2} />, label: 'SalesX' },
        { href: '/field-mobile/customers', icon: <Building2 className="w-[20px] h-[20px]" strokeWidth={2} />, label: 'Müşteriler' },
        { href: '/field-mobile/visits', icon: <History className="w-[20px] h-[20px]" strokeWidth={2} />, label: 'Ziyaretler' },
        { href: '/field-mobile/expenses', icon: <Receipt className="w-[20px] h-[20px]" strokeWidth={2} />, label: 'Masraflarım' },
        { href: '/staff/me', icon: <LayoutGrid className="w-[20px] h-[20px]" strokeWidth={2} />, label: 'Dashboard' },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#0f111a] text-white">
            {/* Safe Area Top */}
            <div className="h-safe-top bg-[#161b22] px-4 py-1 flex justify-between items-center text-[10px] text-gray-400">
                <span>Periodya Field</span>
                <div className="flex items-center gap-2">
                    {uploading && <span className="text-orange-500 animate-pulse">↑ Yükleniyor...</span>}
                    {syncing && <span className="text-blue-500 animate-pulse">↻ Veriler Eşitleniyor...</span>}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-white/10 pb-safe-bottom z-50">
                <div className="flex justify-around items-center h-[72px]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/staff/me' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                <div className={`flex justify-center items-center mb-1.5 ${isActive ? 'scale-110' : ''} transition-transform`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
