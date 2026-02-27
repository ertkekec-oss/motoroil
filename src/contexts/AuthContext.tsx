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
        const checkAuth = () => {
            // Şifre sıfırlama sayfasındaysak hiçbir auth kontrolü yapma
            if (pathname.startsWith('/reset-password')) {
                setIsLoading(false);
                return;
            }

            try {
                // Migration: motoroil_ -> periodya_
                const moUser = localStorage.getItem('motoroil_user') || localStorage.getItem('user');
                const moIsLoggedIn = localStorage.getItem('motoroil_isLoggedIn') || localStorage.getItem('isLoggedIn');

                if (moUser || moIsLoggedIn) {
                    if (moUser) localStorage.setItem('periodya_user', moUser);
                    if (moIsLoggedIn) localStorage.setItem('periodya_isLoggedIn', moIsLoggedIn);
                    ['motoroil_user', 'user', 'motoroil_isLoggedIn', 'isLoggedIn'].forEach(k => localStorage.removeItem(k));
                }

                const storedUser = localStorage.getItem('periodya_user');
                const isLoggedIn = localStorage.getItem('periodya_isLoggedIn');

                if (isLoggedIn === 'true' && storedUser) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);

                    // ONBOARDING REDIRECTION
                    if (userData.setupState === 'PENDING' && pathname !== '/onboarding' && !pathname.startsWith('/api')) {
                        router.push('/onboarding');
                    }
                } else {
                    // Public paths allowed without login
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
                localStorage.setItem('periodya_user', JSON.stringify(userData));
                localStorage.setItem('periodya_isLoggedIn', 'true');

                // Give the browser a moment to process the cookie and state
                setTimeout(() => {
                    setUser(userData);
                    // Redirect based on setupState and permissions
                    if (userData.setupState === 'PENDING') {
                        router.push('/onboarding');
                    } else if (process.env.NEXT_PUBLIC_CONTROL_HUB_ENABLED === 'true') {
                        // FEATURE FLAG ROUTING
                        router.push('/test-desktop');
                    } else {
                        // ADMIN role always goes to main dashboard
                        if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
                            router.push('/');
                        } else {
                            // For non-admin users, check permissions
                            const hasPOS = userData.permissions?.includes('pos_access');
                            const hasFieldSales = userData.permissions?.includes('field_sales_access');

                            if (hasPOS) {
                                router.push('/');
                            } else if (hasFieldSales) {
                                router.push('/field-sales');
                            } else {
                                // Default fallback
                                router.push('/');
                            }
                        }
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
        localStorage.removeItem('periodya_user');
        localStorage.removeItem('periodya_isLoggedIn');
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
        localStorage.setItem('periodya_user', JSON.stringify(updatedUser));
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
