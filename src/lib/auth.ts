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
    } catch (e) {
        return false;
    }
}

export async function createSession(user: any) {
    const token = await new SignJWT({
        id: user.id,
        username: user.username,
        role: user.role,
        branch: user.branch,
        permissions: user.permissions
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
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (err) {
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

export function hasPermission(session: any, permission: string): boolean {
    if (!session) return false;

    // Super admins have all permissions
    const role = session.role?.toUpperCase() || '';
    if (role === 'SUPER_ADMIN' || role.includes('ADMIN')) return true;

    // Check permissions array
    const permissions = session.permissions || [];
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
    return { authorized: true, user: session };
}
