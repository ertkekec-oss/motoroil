const fs = require('fs');
const file = 'src/contexts/AuthContext.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace checkAuth implementation
code = code.replace(
    /const checkAuth = \(\) => \{[\s\S]*?checkAuth\(\);/m,
    `const checkAuth = async () => {
            if (pathname.startsWith('/reset-password')) {
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

        checkAuth();`
);

// Replace login function
code = code.replace(
    /localStorage\.setItem\('periodya_user', JSON\.stringify\(userData\)\);\s*localStorage\.setItem\('periodya_isLoggedIn', 'true'\);/,
    `// localStorage set removed for security (cookie based now)`
);

// Replace logout function
code = code.replace(
    /localStorage\.removeItem\('periodya_user'\);\s*localStorage\.removeItem\('periodya_isLoggedIn'\);/,
    `// localStorage remove is not needed, handled by server cookie`
);

// Replace updateUser function
code = code.replace(
    /localStorage\.setItem\('periodya_user', JSON\.stringify\(updatedUser\)\);/,
    `// localStorage set removed for security`
);

fs.writeFileSync(file, code);
console.log("Replaced successfully");
