"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

import { Wrench, Target, PackageSearch, LayoutGrid } from 'lucide-react';

export default function ServiceMobileLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return <div className="h-screen bg-[#0f111a] flex items-center justify-center text-white">Yükleniyor...</div>;

    const navItems = [
        { href: '/service-mobile/tasks', icon: <Wrench className="w-[20px] h-[20px]" strokeWidth={2.5} />, label: 'Görevlerim' },
        { href: '/service-mobile/performance', icon: <Target className="w-[20px] h-[20px]" strokeWidth={2.5} />, label: 'Başkent (Performans)' },
        { href: '/service-mobile/inventory', icon: <PackageSearch className="w-[20px] h-[20px]" strokeWidth={2.5} />, label: 'Envanter' },
        { href: '/staff/me', icon: <LayoutGrid className="w-[20px] h-[20px]" strokeWidth={2.5} />, label: 'Portal' },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#0f111a] text-white overflow-hidden">
            {/* Safe Area Top Info */}
            <div className="h-safe-top bg-[#161b22]/50 backdrop-blur-md px-4 py-1.5 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-white/5">
                <span>Periodya Service</span>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Çevrimiçi
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 relative custom-scroll">
                {children}
            </main>

            {/* Bottom Navigation (Soft UI Style) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#0f111a]/90 backdrop-blur-2xl border-t border-white/10 pb-safe-bottom z-50">
                <div className="flex justify-around items-center h-[72px] px-2">
                    {navItems.map((item) => {
                        // Check if active
                        let isActive = false;
                        if (item.href === '/staff/me' && pathname === item.href) isActive = true;
                        else if (item.href !== '/staff/me' && pathname.startsWith(item.href)) isActive = true;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                                    isActive ? 'text-blue-500 scale-105' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <div className="relative flex-col items-center justify-center pt-2">
                                    <div className="flex justify-center items-center mb-1 drop-shadow-lg">
                                        {item.icon}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                
                                {isActive && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
