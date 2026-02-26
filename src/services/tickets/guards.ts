import { NextRequest } from 'next/server';

export async function requireTicketAccess(req: NextRequest) {
    const auth = req.headers.get('authorization') || '';
    const isPlatformAdmin = auth.includes('admin');
    const tenantId = req.headers.get('x-tenant-id') || 'TEST_BUYER_TICKET';
    const userId = req.headers.get('x-user-id') || 'user1';
    const role = (req.headers.get('x-role') || 'BUYER') as 'BUYER' | 'SELLER' | 'PLATFORM_ADMIN';

    return {
        tenantId,
        isPlatformAdmin,
        userId,
        role
    };
}
