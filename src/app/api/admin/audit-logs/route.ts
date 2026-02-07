
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    // Permissions: PLATFORM_ADMIN, SUPER_ADMIN, or AUDITOR
    const roll = (user as any).role?.toUpperCase();
    const canView = roll === 'PLATFORM_ADMIN' || roll === 'SUPER_ADMIN' || roll === 'AUDITOR' || roll === 'ADMIN';

    if (!canView) {
        return NextResponse.json({ success: false, error: 'Bu ekranı görmeye yetkiniz yok.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const entity = searchParams.get('entity');
        const action = searchParams.get('action');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let where: any = {};

        // Isolation: If not Platform Admin, only show current tenant logs
        if (roll !== 'PLATFORM_ADMIN') {
            where.tenantId = (user as any).tenantId;
        } else if (tenantId) {
            where.tenantId = tenantId;
        }

        if (entity) where.entity = entity;
        if (action) where.action = action;
        if (userId) where.userId = userId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const logs = await (prisma as any).auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 500 // Limit for performance
        });

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        console.error('Audit Log API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
