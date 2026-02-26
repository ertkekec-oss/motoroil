import { PrismaClient } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';
import { createFinanceAuditLog } from './audit';

const prisma = new PrismaClient();

export async function createCommissionPlan(
    adminUserId: string,
    payload: {
        name: string;
        currency: string;
        roundingMode: 'HALF_UP' | 'UP' | 'DOWN';
        precision: number;
        taxInclusive: boolean;
        companyId?: string;
        isDefault?: boolean;
        rules: any[]; // define rule structure from DB
    }
) {
    const key = `ADMIN_CREATE_COMMISSION_PLAN:${adminUserId}:${Date.now()}`;

    // Normally this logic creates CommissionPlan + CommissionRule in a transaction
    return await withIdempotency(prisma, key, 'FINANCE_COMMISSION_OPS', 'PLATFORM_TENANT_CONST', async (tx) => {
        // Validation: if it's default for a scope, maybe deactivate others or throw if unique constraint fails
        if (payload.isDefault) {
            const existingDefault = await tx.commissionPlan.findFirst({
                where: {
                    ...(payload.companyId ? { companyId: payload.companyId } : {}),
                    isDefault: true
                }
            });
            if (existingDefault) {
                // If creating a new default, either deactivate existing or throw
                // Let's assume we deactivate existing for simplicity, or we let the unique constraints block it
                await tx.commissionPlan.update({
                    where: { id: existingDefault.id },
                    data: { isDefault: false }
                });
            }
        }

        const plan = await tx.commissionPlan.create({
            data: {
                name: payload.name,
                currency: payload.currency,
                roundingMode: payload.roundingMode,
                precision: payload.precision,
                taxInclusive: payload.taxInclusive,
                companyId: payload.companyId,
                isDefault: payload.isDefault || false,
                rules: {
                    create: payload.rules.map(r => ({
                        matchType: r.matchType || 'DEFAULT',
                        ratePercentage: r.ratePercentage || 0,
                        fixedFee: r.fixedFee || 0,
                        priority: r.priority || 0
                    }))
                }
            }
        });

        await createFinanceAuditLog(
            tx,
            'COMMISSION_PLAN_CREATED',
            adminUserId,
            plan.id,
            'CommissionPlan',
            { ...payload, rules: undefined }
        );

        return plan;
    });
}

export async function activateCommissionPlan(adminUserId: string, planId: string) {
    const key = `ADMIN_ACTIVATE_PLAN:${planId}`;

    return await withIdempotency(prisma, key, 'FINANCE_COMMISSION_OPS', 'PLATFORM_TENANT_CONST', async (tx) => {
        const plan = await tx.commissionPlan.findUnique({ where: { id: planId } });
        if (!plan) throw new Error('Plan not found');

        // Find existing active default and deactivate it
        await tx.commissionPlan.updateMany({
            where: {
                id: { not: planId },
                isDefault: true,
                companyId: plan.companyId
            },
            data: {
                isDefault: false
            }
        });

        const updated = await tx.commissionPlan.update({
            where: { id: planId },
            data: { isDefault: true } // activating sets isDefault true
        });

        await createFinanceAuditLog(
            tx,
            'COMMISSION_PLAN_ACTIVATED',
            adminUserId,
            planId,
            'CommissionPlan',
            { companyId: plan.companyId }
        );

        return updated;
    });
}

export async function getCommissionPlansList(cursor?: string, take: number = 20) {
    const plans = await prisma.commissionPlan.findMany({
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' }
    });

    let nextCursor: string | undefined = undefined;
    if (plans.length > take) {
        const nextItem = plans.pop();
        nextCursor = nextItem?.id;
    }

    return { data: plans, nextCursor };
}
