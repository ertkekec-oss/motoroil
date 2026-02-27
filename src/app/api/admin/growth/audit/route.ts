import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isGrowthAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_GROWTH_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function GET(request: Request) {
    try {
        const session: any = await getSession();
        if (!isGrowthAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const actionType = searchParams.get('actionType');
        const take = Math.min(parseInt(searchParams.get('take') || '50'), 100);

        const growthActions = [
            'CREATE_BOOST_RULE', 'DISABLE_BOOST_RULE', 'EXPIRE_BOOST_RULE',
            'UPDATE_BOOST_POLICY', 'RUN_COLLECTION_GUARD', 'CREATE_BILLING_SNAPSHOT',
            'UNBLOCK_SUBSCRIPTION', 'UPDATE_TENANT_ENFORCEMENT'
        ];

        // Merge ops and audit logs ideally, here we read OpsLog since many were written there
        let whereCondition: any = {
            tenantId: 'PLATFORM_ADMIN',
            action: { in: growthActions }
        };

        if (actionType) {
            whereCondition.action = actionType;
        }

        const logs = await prisma.financeOpsLog.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take
        });

        // Some logs went to AuditLog (e.g., UPDATE_BOOST_POLICY)
        let auditWhere: any = {
            tenantId: 'PLATFORM_ADMIN',
            action: { in: growthActions }
        };
        if (actionType) auditWhere.action = actionType;

        const auditLogs = await prisma.financeAuditLog.findMany({
            where: auditWhere,
            orderBy: { createdAt: 'desc' },
            take
        });

        const merged = [...logs, ...auditLogs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, take);

        return NextResponse.json({ items: merged });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
