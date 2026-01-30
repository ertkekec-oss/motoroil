import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Bu middleware her request'te çalışır ve authentication kontrolü yapar
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths - Login olmadan erişilebilir
    const publicPaths = ['/login'];

    // Eğer public path'teyse, devam et
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Static dosyalar ve Next.js internal paths için kontrol yapma
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Client-side'da localStorage kontrolü yapılacak
    // Middleware sadece routing'i kontrol eder
    return NextResponse.next();
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
