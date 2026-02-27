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

export async function GET() {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const plans = await prisma.commissionPlan.findMany({
            where: { archivedAt: null },
            include: {
                _count: {
                    select: { rules: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // The schema sets companyId for tenant-specific overrides. If companyId is null, it's global scope.
        // We'll map this for the UI.
        const mappedPlans = plans.map((p: any) => ({
            ...p,
            scope: p.companyId ? 'COMPANY_OVERRIDE' : 'GLOBAL',
            ruleCount: p._count.rules
        }));

        return NextResponse.json(mappedPlans);
    } catch (error: any) {
        console.error('Commission Plans GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, isDefault, scope, companyId, currency, roundingMode, precision, taxInclusive, reason } = body;

        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ error: 'A valid reason is required for governance changes' }, { status: 400 });
        }

        if (scope === 'COMPANY_OVERRIDE' && !companyId) {
            return NextResponse.json({ error: 'companyId is required for COMPANY_OVERRIDE scope' }, { status: 400 });
        }

        const targetCompanyId = scope === 'COMPANY_OVERRIDE' ? companyId : null;

        // If making default, disable other defaults for the same companyId
        const newPlan = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.commissionPlan.updateMany({
                    where: { companyId: targetCompanyId, isDefault: true, archivedAt: null },
                    data: { isDefault: false }
                });
            }

            const plan = await tx.commissionPlan.create({
                data: {
                    name,
                    description,
                    isDefault: isDefault || false,
                    companyId: targetCompanyId,
                    currency: currency || 'TRY',
                    roundingMode: roundingMode || 'HALF_UP',
                    precision: precision !== undefined ? precision : 2,
                    taxInclusive: taxInclusive || false
                }
            });

            await tx.financeAuditLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: 'COMMISSION_PLAN_CREATE',
                    actor: session.id || 'SYSTEM',
                    entityId: plan.id,
                    entityType: 'CommissionPlan',
                    payloadJson: { reason, plan }
                }
            });

            return plan;
        });

        return NextResponse.json({ success: true, plan: newPlan });
    } catch (error: any) {
        console.error('Commission Plans POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
