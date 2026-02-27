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

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await props.params;

        const body = await request.json();
        const { reason } = body;

        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ error: 'A valid reason is required for governance changes' }, { status: 400 });
        }

        const archivedPlan = await prisma.$transaction(async (tx) => {
            const plan = await tx.commissionPlan.update({
                where: { id: params.id },
                data: {
                    archivedAt: new Date(),
                    isDefault: false
                }
            });

            await tx.financeAuditLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: 'COMMISSION_PLAN_ARCHIVE',
                    actor: session.id || 'SYSTEM',
                    entityId: params.id,
                    entityType: 'CommissionPlan',
                    payloadJson: { reason, planId: params.id }
                }
            });

            return plan;
        });

        return NextResponse.json({ success: true, archivedPlan });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
