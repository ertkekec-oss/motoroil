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

const getJWTAscii = () => new TextEncoder().encode(getJWTSecret());

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

    // 2. ADMIN GUARD (CRITICAL: MUST BE BEFORE NETWORK GUARD)
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const sessionToken = request.cookies.get('session')?.value;

        if (!sessionToken) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const { payload } = await jwtVerify(sessionToken, getJWTAscii());
            const allowedAdminRoles = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'];
            // @ts-ignore Let's safely check payload role
            const userRole = payload?.role as string;

            if (!allowedAdminRoles.includes(userRole)) {
                if (pathname.startsWith('/api')) {
                    return NextResponse.json({ error: 'Bu alana erişim yetkiniz yok.' }, { status: 403 });
                }
                return NextResponse.redirect(new URL('/login', request.url));
            }

            return NextResponse.next();
        } catch (err) {
            console.error('Middleware admin session error:', err);
            const response = pathname.startsWith('/api')
                ? NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 })
                : NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session');
            return response;
        }
    }

    // 3. NETWORK B2B PORTAL GUARD (Dealer Auth)
    const base = portalBasePath();
    if (pathname.startsWith(base)) {
        const isLogin = pathname.startsWith(`${base}/login`);
        const isInvite = pathname.startsWith(`${base}/invite`);
        const isApi = pathname.startsWith(`${base}/api`);

        if (isLogin || isInvite) {
            return NextResponse.next();
        }

        const hasSession = Boolean(request.cookies.get("pdya_ds")?.value);
        const hasMembership = Boolean(request.cookies.get("pdya_nm")?.value);

        if (!hasSession) {
            if (isApi) {
                return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
            }
            return NextResponse.redirect(new URL(`${base}/login`, request.url));
        }

        // session var, membership yoksa select sayfasına yönlendir
        const isSelect = pathname.startsWith(`${base}/select-supplier`);
        if (!hasMembership && !isSelect) {
            if (isApi) {
                return NextResponse.json({ error: 'Membership required' }, { status: 403 });
            }
            return NextResponse.redirect(new URL(`${base}/select-supplier`, request.url));
        }

        return NextResponse.next();
    }

    // 4. Auth Related Paths & Public API - Allowed
    const publicPaths = [
        '/', '/login', '/register', '/reset-password',
        '/portal/login', '/portal/signatures',
        '/api/auth', '/api/public', '/api/network', '/api/portal',
        '/api/admin/marketplace/queue/health',
        '/pdks', '/api/v1/pdks/display',
        '/api/test-me', '/api/test-db', '/api/test-cookies'
    ];
    if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        return NextResponse.next();
    }

    // Special case: Allow public invoice PDF downloads for sharing
    if (pathname === '/api/sales/invoices' && request.nextUrl.searchParams.get('action') === 'get-pdf') {
        return NextResponse.next();
    }

    // 5. GLOBAL SESSION GUARD (Protected Paths)
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await jwtVerify(sessionToken, getJWTAscii());
        return NextResponse.next();
    } catch (err) {
        console.error('Middleware global session error:', err);
        const response = pathname.startsWith('/api')
            ? NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));

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
