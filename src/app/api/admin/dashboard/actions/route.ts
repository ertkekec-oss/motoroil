import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

function hasAdminActionRole(session: any, actionType: string) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    if (role === 'SUPER_ADMIN' || session.tenantId === 'PLATFORM_ADMIN') return true;

    if (['RUN_RECONCILE_PULL', 'RUN_REPAIR_JOB'].includes(actionType)) {
        return role === 'PLATFORM_FINANCE_ADMIN';
    }
    if (['RUN_COLLECTION_GUARD', 'SNAPSHOT_BILLING_HEALTH'].includes(actionType)) {
        return ['PLATFORM_GROWTH_ADMIN', 'PLATFORM_FINANCE_ADMIN'].includes(role);
    }
    if (['RUN_SENTINEL_SCAN', 'RUN_OUTBOX_RETRY', 'SNAPSHOT_OPS_HEALTH'].includes(actionType)) {
        return role === 'OPS_ADMIN';
    }
    return false;
}

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        const body = await request.json();
        const { actionType, reason } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!actionType) return NextResponse.json({ error: 'actionType is required' }, { status: 400 });
        if (!hasAdminActionRole(session, actionType)) {
            return NextResponse.json({ error: 'Unauthorized role for this action' }, { status: 403 });
        }
        if (!idempotencyKey) return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        if (!reason || reason.length < 10) return NextResponse.json({ error: 'Reason must be at least 10 chars' }, { status: 400 });

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            // Mock executing the action since this delegates to workers/other modules usually
            let summary = {};
            if (actionType === 'RUN_COLLECTION_GUARD') {
                summary = { run: true, blocked: 0, overdue: 0 };
            } else if (actionType === 'RUN_RECONCILE_PULL') {
                summary = { reconciled: 15, pending: 2 };
            } else if (actionType === 'SNAPSHOT_BILLING_HEALTH') {
                summary = { saved: true, date: new Date().toISOString() };
            } else {
                summary = { executed: true };
            }

            // Log to OpsLog
            await prisma.financeOpsLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: actionType,
                    actor: session.id || 'SYSTEM',
                    payloadJson: { reason, summary }
                }
            });

            return summary;
        });

        return NextResponse.json({ ok: true, summary: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
