"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    username: string;
    role: 'Admin' | 'Personel';
    branch: string;
    name: string;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
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
                // Eski localStorage key'lerini temizle (migration)
                const oldIsLoggedIn = localStorage.getItem('isLoggedIn');
                const oldUser = localStorage.getItem('user');

                if (oldIsLoggedIn || oldUser) {
                    // Eski verileri yeni formata taşı
                    if (oldIsLoggedIn === 'true' && oldUser) {
                        try {
                            const userData = JSON.parse(oldUser);
                            localStorage.setItem('motoroil_user', oldUser);
                            localStorage.setItem('motoroil_isLoggedIn', 'true');
                        } catch (e) {
                            console.error('Migration error:', e);
                        }
                    }
                    // Eski key'leri sil
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('user');
                }

                // Migration: motoroil_ -> periodya_
                const moUser = localStorage.getItem('motoroil_user');
                const moIsLoggedIn = localStorage.getItem('motoroil_isLoggedIn');
                if (moUser || moIsLoggedIn) {
                    if (moUser) localStorage.setItem('periodya_user', moUser);
                    if (moIsLoggedIn) localStorage.setItem('periodya_isLoggedIn', moIsLoggedIn);
                    localStorage.removeItem('motoroil_user');
                    localStorage.removeItem('motoroil_isLoggedIn');
                }

                const storedUser = localStorage.getItem('periodya_user');
                const isLoggedIn = localStorage.getItem('periodya_isLoggedIn');

                if (isLoggedIn === 'true' && storedUser) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
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
                localStorage.clear();

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
                setUser(userData);
                localStorage.setItem('periodya_user', JSON.stringify(userData));
                localStorage.setItem('periodya_isLoggedIn', 'true');
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

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                hasPermission
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
