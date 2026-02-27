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

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await props.params;

        const plan = await prisma.commissionPlan.findUnique({
            where: { id: params.id },
            include: { rules: { orderBy: { priority: 'desc' } } }
        });

        if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({
            ...plan,
            scope: plan.companyId ? 'COMPANY_OVERRIDE' : 'GLOBAL'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await props.params;

        const body = await request.json();
        const { reason, rules, ...updates } = body;

        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ error: 'A valid reason is required for governance changes' }, { status: 400 });
        }

        const plan = await prisma.$transaction(async (tx) => {
            if (updates.isDefault) {
                const currentPlan = await tx.commissionPlan.findUnique({ where: { id: params.id } });
                await tx.commissionPlan.updateMany({
                    where: { companyId: currentPlan?.companyId || null, isDefault: true, id: { not: params.id } },
                    data: { isDefault: false }
                });
            }

            // Update plan details
            const updatedPlan = await tx.commissionPlan.update({
                where: { id: params.id },
                data: {
                    name: updates.name,
                    description: updates.description,
                    isDefault: updates.isDefault,
                    currency: updates.currency,
                    roundingMode: updates.roundingMode,
                    precision: updates.precision,
                    taxInclusive: updates.taxInclusive
                }
            });

            // If rules provided, sync them (delete old, create new)
            if (rules && Array.isArray(rules)) {
                await tx.commissionRule.deleteMany({
                    where: { planId: params.id }
                });

                for (const r of rules) {
                    await tx.commissionRule.create({
                        data: {
                            planId: params.id,
                            scope: r.scope || 'GLOBAL',
                            matchType: r.matchType || 'DEFAULT',
                            category: r.category,
                            brand: r.brand,
                            ratePercentage: r.ratePercentage,
                            fixedFee: r.fixedFee,
                            priority: r.priority || 0
                        }
                    });
                }
            }

            await tx.financeAuditLog.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    action: 'COMMISSION_PLAN_UPDATE',
                    actor: session.id || 'SYSTEM',
                    entityId: params.id,
                    entityType: 'CommissionPlan',
                    payloadJson: { reason, updates, rulesCount: rules?.length }
                }
            });

            return updatedPlan;
        });

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
