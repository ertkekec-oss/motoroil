import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// SECURITY: JWT_SECRET must be set in production
const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set in production!');
        }
        return 'dev-only-secret-key-change-in-production';
    }

    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long for security');
    }

    return secret;
};

const JWT_SECRET = new TextEncoder().encode(getJWTSecret());

function portalBasePath() {
    const p = process.env.NEXT_PUBLIC_PORTAL_BASE_PATH || "/network"
    return p.startsWith("/") ? p : `/${p}`
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Static & Public Files - Always allowed
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // 2. NETWORK B2B PORTAL GUARD (Dealer Auth)
    const base = portalBasePath();
    if (pathname.startsWith(base)) {
        const isApi = pathname.startsWith(`${base}/api/`);
        const isLogin = pathname.startsWith(`${base}/login`);

        const hasSession = Boolean(request.cookies.get("pdya_ds")?.value);
        const hasMembership = Boolean(request.cookies.get("pdya_nm")?.value);

        if (!hasSession) {
            if (isApi) {
                // allow OTP endpoints
                if (pathname.includes('/api/network/auth/otp')) return NextResponse.next();
                return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
            }
            if (!isLogin) return NextResponse.redirect(new URL(`${base}/login`, request.url));
            return NextResponse.next();
        }

        // session var, membership yoksa select sayfasına yönlendir (login sayfası hariç)
        if (!hasMembership) {
            if (isApi) {
                // allow context switch and logout endpoint
                if (pathname.includes('/api/network/context/switch') || pathname.includes('/api/network/auth/logout')) return NextResponse.next();
                return NextResponse.json({ error: "NO_ACTIVE_MEMBERSHIP" }, { status: 403 });
            }
            const isSelect = pathname.startsWith(`${base}/select-supplier`);
            if (!isLogin && !isSelect) return NextResponse.redirect(new URL(`${base}/select-supplier`, request.url));
        }

        return NextResponse.next();
    }

    // 3. Auth Related Paths - Allowed
    const publicPaths = [
        '/', '/login', '/register', '/reset-password',
        '/api/auth', '/api/public',
        '/api/admin/marketplace/queue/health',
        '/pdks', '/api/v1/pdks/display'
    ];
    if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        return NextResponse.next();
    }

    // Special case: Allow public invoice PDF downloads for sharing
    if (pathname === '/api/sales/invoices' && request.nextUrl.searchParams.get('action') === 'get-pdf') {
        return NextResponse.next();
    }

    // 4. Protected Paths - Verify Session
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
        // For API calls, return 401
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }
        // For Page calls, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Verify JWT
        await jwtVerify(sessionToken, JWT_SECRET);
        return NextResponse.next();
    } catch (err) {
        console.error('Middleware session error:', err);
        // Invalid session
        const response = pathname.startsWith('/api')
            ? NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));

        // Clear invalid cookie
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
