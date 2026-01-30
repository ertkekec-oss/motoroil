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

// Mock kullanıcı veritabanı - Gerçek uygulamada bu backend'den gelecek
const USERS = [
    {
        username: 'admin',
        password: 'admin123',
        role: 'Admin' as const,
        branch: 'Merkez Depo',
        name: 'Yönetici',
        permissions: ['*'] // Tüm yetkiler
    },
    {
        username: 'kadikoy',
        password: 'kadikoy123',
        role: 'Personel' as const,
        branch: 'Kadıköy Şube',
        name: 'Ahmet Yılmaz',
        permissions: ['pos', 'sales', 'inventory_view', 'service']
    },
    {
        username: 'besiktas',
        password: 'besiktas123',
        role: 'Personel' as const,
        branch: 'Beşiktaş Şube',
        name: 'Mehmet Demir',
        permissions: ['pos', 'sales', 'inventory_view', 'service']
    },
    {
        username: 'izmir',
        password: 'izmir123',
        role: 'Personel' as const,
        branch: 'İzmir Şube',
        name: 'Ayşe Kaya',
        permissions: ['pos', 'sales', 'inventory_view', 'service']
    },
];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Sayfa yüklendiğinde localStorage'dan kullanıcıyı kontrol et
    useEffect(() => {
        const checkAuth = () => {
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

                const storedUser = localStorage.getItem('motoroil_user');
                const isLoggedIn = localStorage.getItem('motoroil_isLoggedIn');

                if (isLoggedIn === 'true' && storedUser) {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                } else {
                    // Login sayfasında değilse, login'e yönlendir
                    if (pathname !== '/login') {
                        router.push('/login');
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
                localStorage.clear();
                if (pathname !== '/login') {
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
            // 1. Try DB Login
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
                localStorage.setItem('motoroil_user', JSON.stringify(userData));
                localStorage.setItem('motoroil_isLoggedIn', 'true');
                return true;
            }

            // 2. Fallback to hardcoded USERS (for dev/emergency)
            const foundUser = USERS.find(
                u => u.username === username && u.password === password
            );

            if (!foundUser) {
                return false;
            }

            const userData: User = {
                username: foundUser.username,
                role: foundUser.role,
                branch: foundUser.branch,
                name: foundUser.name,
                permissions: foundUser.permissions
            };

            setUser(userData);
            localStorage.setItem('motoroil_user', JSON.stringify(userData));
            localStorage.setItem('motoroil_isLoggedIn', 'true');

            return true;
        } catch (error) {
            console.error('Login error:', error);
            // Even if API fails, check hardcoded
            const foundUser = USERS.find(
                u => u.username === username && u.password === password
            );
            if (foundUser) {
                const userData: User = {
                    username: foundUser.username,
                    role: foundUser.role,
                    branch: foundUser.branch,
                    name: foundUser.name,
                    permissions: foundUser.permissions
                };
                setUser(userData);
                localStorage.setItem('motoroil_user', JSON.stringify(userData));
                localStorage.setItem('motoroil_isLoggedIn', 'true');
                return true;
            }
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('motoroil_user');
        localStorage.removeItem('motoroil_isLoggedIn');
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
