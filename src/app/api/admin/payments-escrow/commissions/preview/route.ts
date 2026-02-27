import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { resolveCommissionRule, calculateCommission } from '@/services/finance/commission/ruleResolution';

export const dynamic = 'force-dynamic';

function isPlatformAdmin(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_FINANCE_ADMIN' || tenantId === 'PLATFORM_ADMIN';
}

export async function POST(request: Request) {
    try {
        const session: any = await getSession();
        if (!isPlatformAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { companyId, categoryId, brandId, grossAmount = 1000 } = body;

        let activePlan: any = null;

        if (companyId) {
            activePlan = await prisma.commissionPlan.findFirst({
                where: { companyId, isDefault: true, archivedAt: null },
                include: { rules: true }
            });
        }

        if (!activePlan) {
            activePlan = await prisma.commissionPlan.findFirst({
                where: { companyId: null, isDefault: true, archivedAt: null },
                include: { rules: true }
            });
        }

        if (!activePlan) {
            return NextResponse.json({ error: 'No active commission plan found' }, { status: 404 });
        }

        const rule = resolveCommissionRule(activePlan.rules, {
            category: categoryId,
            brand: brandId,
            sellerCompanyId: companyId
        });

        if (!rule) {
            return NextResponse.json({
                error: 'No matching rule found in the plan',
                plan: activePlan.name
            });
        }

        const breakdown = calculateCommission(rule, Number(grossAmount), activePlan);

        return NextResponse.json({
            success: true,
            plan: {
                id: activePlan.id,
                name: activePlan.name,
                scope: activePlan.companyId ? 'COMPANY_OVERRIDE' : 'GLOBAL',
                currency: activePlan.currency
            },
            rule: {
                id: rule.id,
                matchType: rule.matchType,
                scope: rule.scope,
                priority: rule.priority,
                ratePercentage: Number(rule.ratePercentage),
                fixedFee: Number(rule.fixedFee)
            },
            grossAmount: Number(grossAmount),
            commissionDetails: breakdown,
            effectiveTakeRate: (breakdown.total / Number(grossAmount)) * 100
        });

    } catch (error: any) {
        console.error('Commission Preview error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
