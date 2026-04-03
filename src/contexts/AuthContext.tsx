"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string; // Add ID as it's useful
    username: string;
    role: string;
    branch: string;
    name: string;
    email?: string;
    tenantId: string;
    permissions: string[];
    setupState?: 'PENDING' | 'COMPLETED';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider bileşeni
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Sayfa yüklendiğinde localStorage'dan kullanıcıyı kontrol et
    useEffect(() => {
        const checkAuth = async () => {
            const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
            // Determine if the current domain is a primary app domain or a B2B/custom subdomain
            const isPrimaryDomain = 
                hostname === 'periodya.com' || 
                hostname === 'www.periodya.com' ||
                hostname === 'localhost' ||
                hostname === 'vercel.app' ||
                hostname.includes('vercel.app');

            const isB2BSubdomain = 
                hostname === 'b2b.periodya.com' || 
                hostname.startsWith('b2b.localhost') || 
                !isPrimaryDomain;

            // B2B and Portal use their own auth context, skip global auth check & redirects
            if (pathname.startsWith('/reset-password') || isB2BSubdomain || pathname.startsWith('/network') || pathname.startsWith('/portal')) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/me');

                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user) {
                        setUser(data.user);

                        // Temizlik: Eski localStorage verilerini sil
                        ['periodya_user', 'periodya_isLoggedIn', 'motoroil_user', 'user', 'motoroil_isLoggedIn', 'isLoggedIn'].forEach(k => localStorage.removeItem(k));

                        // ONBOARDING REDIRECTION
                        if (data.user.setupState === 'PENDING' && pathname !== '/onboarding' && !pathname.startsWith('/api')) {
                            router.push('/onboarding');
                        }
                    } else {
                        const publicPaths = ['/login', '/register', '/', '/reset-password'];
                        const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
                        if (!isPublicPath) {
                            router.push('/login');
                        }
                    }
                } else {
                    const publicPaths = ['/login', '/register', '/', '/reset-password'];
                    const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
                    if (!isPublicPath) {
                        router.push('/login');
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
                const publicPaths = ['/login', '/register', '/', '/reset-password'];
                const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
                if (!isPublicPath) {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const userData = await res.json();
                // localStorage set removed for security (cookie based now)

                // Give the browser a moment to process the cookie and state
                setTimeout(() => {
                    setUser(userData);
                    // Redirect based on setupState and permissions
                    if (userData.setupState === 'PENDING') {
                        router.push('/onboarding');
                    } else if (userData.role && (userData.role.toUpperCase() === 'SUPER_ADMIN' || userData.role.toUpperCase() === 'PLATFORM_ADMIN')) {
                        router.push('/desktop');
                    } else {
                        router.push('/staff/me');
                    }
                }, 100);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error:', e);
        }
        setUser(null);
        // localStorage remove is not needed, handled by server cookie
        router.push('/login');
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.permissions.includes('*')) return true; // Admin tüm yetkilere sahip
        return user.permissions.includes(permission);
    };

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        // localStorage set removed for security
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                hasPermission,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
