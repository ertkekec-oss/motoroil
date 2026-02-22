import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// SECURITY: JWT_SECRET must be set in production
const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set in production!');
        }
        console.warn('⚠️ WARNING: Using default JWT_SECRET in development. DO NOT use in production!');
        return 'dev-only-secret-key-change-in-production';
    }

    if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long for security');
    }

    return secret;
};

const JWT_SECRET = new TextEncoder().encode(getJWTSecret());

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
    try {
        // If hash starts with $2a or $2b, it's a bcrypt hash
        if (hash.startsWith('$2a$') || hash.startsWith('$2y$') || hash.startsWith('$2b$')) {
            return await bcrypt.compare(password, hash);
        }
        // Fallback for plain text (migration period)
        return password === hash;
    } catch {
        return false;
    }
}

export async function createSession(user: any) {
    const token = await new SignJWT({
        id: user.id,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId, // Add tenantId to session
        companyId: user.companyId || (user.type === 'service' ? user.companyId : undefined), // Ensure companyId is passed if available
        setupState: user.setupState || 'COMPLETED',
        branch: user.branch,
        permissions: user.permissions,
        assignedCategoryIds: user.assignedCategoryIds || []
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
    });

    return token;
}

export async function getSession() {
    let token: string | undefined;
    try {
        const cookieStore = await cookies();
        token = cookieStore.get('session')?.value;
    } catch {
        // Not in a request context (e.g. background job, script)
    }

    let headersList: any = null;
    try {
        headersList = await (await import('next/headers')).headers();
    } catch {
        // Not in a request context
    }

    const cronSecret = headersList?.get('x-cron-secret');

    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
        return {
            id: 'SYSTEM',
            username: 'SYSTEM_CRON',
            role: 'PLATFORM_ADMIN',
            tenantId: 'PLATFORM_ADMIN',
            isSystem: true
        };
    }

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        // TRANSFORM: Map flat JWT payload to structured session.user object
        // This ensures session.user.companyId is the single source of truth
        const sessionUser: any = {
            ...payload,
            // Ensure companyId is strictly defined in user object
            companyId: payload.companyId || (payload as any).user?.companyId
        };

        const session: any = {
            ...sessionUser, // Flat access (tenantId, id, etc.)
            user: sessionUser, // Nested access (.user.id)
            expiry: payload.exp
        };

        // Support for Platform Admin Impersonation
        const role = sessionUser.role?.toUpperCase() || '';
        if (sessionUser.tenantId === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN') {
            const targetTenantId = headersList?.get('x-target-tenant-id');
            if (targetTenantId) {
                session.user.impersonateTenantId = targetTenantId;
                session.user.isImpersonating = true;
            }
        }

        return session;
    } catch {
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

export function hasPermission(session: any, permission: string): boolean {
    if (!session) return false;

    // Support new structure { user: ... }
    const user = session.user || session;

    // Super admins have all permissions
    const role = user.role?.toUpperCase() || '';
    if (role === 'SUPER_ADMIN' || role.includes('ADMIN')) return true;

    // Check permissions array
    const permissions = user.permissions || [];
    if (permissions.includes('*') || permissions.includes('ALL')) return true;

    return permissions.includes(permission);
}

export async function authorize() {
    const session = await getSession();
    if (!session) {
        return {
            authorized: false,
            response: Response.json({ success: false, error: 'Oturum gerekli.' }, { status: 401 })
        };
    }

    const user = session.user || session;

    // Auto-resolve companyId if missing from session
    if (!user.companyId) {
        user.companyId = await resolveCompanyId(user);
    }

    return { authorized: true, user };
}

export function verifyWriteAccess(session: any) {
    const user = session?.user || session;
    if (user?.role?.toUpperCase() === 'AUDITOR') {
        return {
            authorized: false,
            response: Response.json({ success: false, error: 'Denetçi hesabı veri girişi yapamaz (Read-only).' }, { status: 403 })
        };
    }
    return { authorized: true };
}

/**
 * Resolves the company context for a user.
 * 1. Returns companyId from session if present
 * 2. Otherwise finds the first accessible company from UserCompanyAccess
 */
export async function resolveCompanyId(user: any): Promise<string | undefined> {
    if (user.companyId) return user.companyId;

    // Use prismaBase to avoid circular middleware dependency 
    const prisma = (await import('@/lib/prisma')).default;

    const access = await prisma.userCompanyAccess.findFirst({
        where: { userId: user.id },
        select: { companyId: true }
    });

    if (access?.companyId) return access.companyId;

    // Fallback for Platform Admin or Super Admin: Get first company
    const role = (user.role || '').toUpperCase();
    if (user.tenantId === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN') {
        const firstCompany = await prisma.company.findFirst({
            select: { id: true }
        });
        return firstCompany?.id;
    }

    return undefined;
}
