
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getPortalUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('portal_token');
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me');
        const { payload } = await jwtVerify(token.value, secret);
        return payload as { id: string, role: string, tenantId: string, companyName: string, name: string };
    } catch { return null; }
}
