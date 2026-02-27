import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isPlatformAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const actionFilter = searchParams.get('action');
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

        const whereClause: any = {
            tenantId: 'PLATFORM_ADMIN',
            action: {
                in: [
                    'ESCROW_POLICY_UPDATE',
                    'COMMISSION_PLAN_CREATE',
                    'COMMISSION_PLAN_UPDATE',
                    'COMMISSION_PLAN_ARCHIVE',
                    'PROVIDER_RECONCILE_TRIGGER',
                    'KILL_SWITCH_TOGGLE'
                ]
            }
        };

        if (actionFilter) {
            whereClause.action = actionFilter;
        }

        const auditLogs = await prisma.financeAuditLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({ logs: auditLogs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
