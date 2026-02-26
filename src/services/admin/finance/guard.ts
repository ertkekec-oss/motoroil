import { getSession } from '../../../lib/auth';
import { NextRequest } from 'next/server';

export async function requirePlatformFinanceAdmin(req?: NextRequest) {
    if (req) {
        const authHeader = req.headers.get('authorization');
        const adminToken = process.env.ADMIN_TOKEN;
        if (adminToken && authHeader === `Bearer ${adminToken}`) {
            return {
                id: 'SYSTEM_ADMIN_TOKEN',
                role: 'PLATFORM_ADMIN',
                tenantId: 'PLATFORM_TENANT_CONST',
                companyId: 'PLATFORM_TENANT_CONST'
            };
        }
    }

    const session = await getSession();
    if (!session?.user) {
        throw new Error('UNAUTHORIZED: No session');
    }

    const role = (session.user.role || '').toUpperCase();
    const isPlatformAdmin = role === 'PLATFORM_ADMIN' || session.user.tenantId === 'PLATFORM_ADMIN';
    const isFinanceAdmin = role === 'FINANCE_ADMIN';

    if (!isPlatformAdmin && !isFinanceAdmin) {
        throw new Error('FORBIDDEN: Platform Finance Admin role required');
    }

    return session.user;
}
