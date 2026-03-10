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
    const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    const isBillingProductGet = pathname === '/api/admin/billing-products' && request.method === 'GET';

    if (isAdminPath && !isBillingProductGet) {
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

    // --- SUBDOMAIN LOGIC FOR B2B PORTAL & CUSTOM DOMAINS ---
    const hostname = request.headers.get("host") || "";
    // Note: Always remove port number before evaluating production domains if needed (localhost keeps it)
    const hostnameWithoutPort = hostname.split(':')[0];

    const isPrimaryDomain = 
        hostnameWithoutPort === 'periodya.com' || 
        hostnameWithoutPort === 'www.periodya.com' ||
        hostnameWithoutPort === 'localhost' ||
        hostnameWithoutPort === 'vercel.app' || // For default vercel deployment urls
        hostname.includes('vercel.app');

    // A subdomain is considered a B2B subdomain if it's the default b2b.* domain, 
    // OR if it's NOT the primary app domain (thus presumed to be a custom tenant domain)
    const isB2BSubdomain = 
        hostnameWithoutPort === 'b2b.periodya.com' || 
        hostname.startsWith('b2b.localhost') || 
        !isPrimaryDomain;

    const base = portalBasePath(); // usually "/network"

    // Feature 1: Redirect old /network/* accessed via main domain to subdomain
    // E.g. periodya.com/network/login -> b2b.periodya.com/login
    if (!isB2BSubdomain && pathname.startsWith(base)) {
        const newPath = pathname.replace(new RegExp(`^${base}`), '') || '/login';
        const url = request.nextUrl.clone();
        url.pathname = newPath;
        url.hostname = hostname.includes('localhost') ? 'b2b.localhost' : 'b2b.periodya.com';
        if (hostname.includes('localhost') && hostname.includes(':')) {
            url.port = hostname.split(':')[1];
        } else {
            url.port = ''; // Clear port for production
        }
        return NextResponse.redirect(url);
    }

    // Feature 2: If user accesses the root of the B2B subdomain, redirect to /login
    // E.g. b2b.periodya.com/ -> b2b.periodya.com/login (this happens visible to user)
    if (isB2BSubdomain && pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Determine if the current request is for the B2B portal
    // Either it's on the subdomain (and not an API or admin path) or it has the /network prefix (handled above)
    const isApiOrAdmin = pathname.startsWith('/api/') || pathname.startsWith('/admin/');
    const isB2BPortalRequest = (isB2BSubdomain && !isApiOrAdmin) || pathname.startsWith(base);

    let finalResponse: NextResponse | null = null;

    // 3. NETWORK B2B PORTAL GUARD (Dealer Auth)
    if (isB2BPortalRequest) {
        // Evaluate effective pathname for internal guard checks
        const effectivePathname = (isB2BSubdomain && !pathname.startsWith(base)) 
            ? `${base}${pathname === '/' ? '' : pathname}` 
            : pathname;

        const isLogin = effectivePathname.startsWith(`${base}/login`);
        const isInvite = effectivePathname.startsWith(`${base}/invite`);
        const isApi = effectivePathname.startsWith(`${base}/api`); // For B2B specific API if any

        if (!(isLogin || isInvite)) {
            const hasSession = Boolean(request.cookies.get("pdya_ds")?.value);
            const hasMembership = Boolean(request.cookies.get("pdya_nm")?.value);

            if (!hasSession) {
                if (isApi) {
                    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
                }
                const loginUrl = isB2BSubdomain ? '/login' : `${base}/login`;
                return NextResponse.redirect(new URL(loginUrl, request.url));
            }

            // session var, membership yoksa select sayfasına yönlendir
            const isSelect = effectivePathname.startsWith(`${base}/select-supplier`);
            if (!hasMembership && !isSelect) {
                if (isApi) {
                    return NextResponse.json({ error: 'Membership required' }, { status: 403 });
                }
                const selectUrl = isB2BSubdomain ? '/select-supplier' : `${base}/select-supplier`;
                return NextResponse.redirect(new URL(selectUrl, request.url));
            }
        }

        if (isB2BSubdomain) {
            finalResponse = NextResponse.rewrite(new URL(effectivePathname, request.url));
        }
    }

    // 4. Auth Related Paths & Public API - Allowed
    const publicPaths = [
        '/', '/login', '/register', '/reset-password',
        '/portal/login', '/portal/signatures', '/verify',
        '/api/auth', '/api/public', '/api/network', '/api/portal',
        '/api/admin/marketplace/queue/health',
        '/pdks', '/api/v1/pdks/display',
        '/api/test-me', '/api/test-db', '/api/test-cookies'
    ];
    
    // We also consider /network/login and such as public if handled behind a B2B rewrite
    const effectivePublicPath = isB2BSubdomain ? (pathname === '/login' ? '/network/login' : pathname) : pathname;

    if (publicPaths.some(path => effectivePublicPath === path || effectivePublicPath.startsWith(path + '/'))) {
        return finalResponse || NextResponse.next();
    }

    // Special case: Allow public invoice PDF downloads for sharing
    if (pathname === '/api/sales/invoices' && request.nextUrl.searchParams.get('action') === 'get-pdf') {
        return finalResponse || NextResponse.next();
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
        return finalResponse || NextResponse.next();
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
