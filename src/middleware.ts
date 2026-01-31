import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'motoroil-super-secret-key-12345'
);

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

    // 2. Auth Related Paths - Allowed
    const publicPaths = ['/login', '/reset-password', '/api/auth/login'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 3. Protected Paths - Verify Session
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
