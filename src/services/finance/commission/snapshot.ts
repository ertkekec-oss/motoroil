import { prisma } from '@/lib/prisma';
import { Prisma, CommissionSnapshot } from '@prisma/client';
import { resolveRuleForLine, CommissionRuleSortable } from './ruleResolution';
import { calculateLineCommission } from './calculator';
import { AlreadyRunningError, NotFoundError, ErrorCode, ValidationError } from './errors';

export async function createCommissionSnapshotForOrder(
    tenantId: string,
    networkOrderId: string
): Promise<CommissionSnapshot> {
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);
    const idempotencyKey = `SNAPSHOT_CREATE:order:${networkOrderId}`;

    return await prisma.$transaction(async (tx) => {
        // === 1. Lock Idempotency ===
        let record = await tx.idempotencyRecord.findUnique({
            where: { key: idempotencyKey }
        });

        if (record) {
            if (record.status === 'SUCCEEDED') {
                const existing = await tx.commissionSnapshot.findUnique({
                    where: { networkOrderId }
                });
                if (!existing) throw new NotFoundError('Snapshot is missing despite idempotency success');
                return existing;
            }

            if (record.status === 'STARTED' && record.lockedAt > cutoffTime) {
                throw new AlreadyRunningError(`Snapshot creation is already running for order ${networkOrderId}`);
            }

            // Takeover stale or FAILED
            await tx.idempotencyRecord.update({
                where: { key: idempotencyKey },
                data: { status: 'STARTED', lockedAt: new Date(), tenantId } // update timestamp
            });
        } else {
            await tx.idempotencyRecord.create({
                data: {
                    key: idempotencyKey,
                    scope: 'SNAPSHOT_CREATE',
                    tenantId,
                    status: 'STARTED',
                    lockedAt: new Date()
                }
            });
        }

        // === 2. Double-check snapshot existence ===
        const existing = await tx.commissionSnapshot.findUnique({
            where: { networkOrderId }
        });
        if (existing) {
            await tx.idempotencyRecord.update({
                where: { key: idempotencyKey },
                data: { status: 'SUCCEEDED', completedAt: new Date() }
            });
            return existing;
        }

        // === 3. Fetch Order + Items ===
        const order = await tx.networkOrder.findUnique({
            where: { id: networkOrderId },
            include: { networkItems: true }
        });

        if (!order) {
            throw new NotFoundError(`NetworkOrder ${networkOrderId} not found.`);
        }

        const sellerCompanyId = order.sellerCompanyId;

        // === 4. Fetch Commission Plans (Tenant Safe) ===
        const plans = await tx.commissionPlan.findMany({
            where: {
                OR: [
                    { companyId: sellerCompanyId, isDefault: true, archivedAt: null },
                    { companyId: null, isDefault: true, archivedAt: null }
                ]
            },
            include: { rules: true },
            orderBy: {
                companyId: 'desc'
            }
        });

        const activePlan = plans[0];
        if (!activePlan) {
            throw new ValidationError('No active commission plan found for seller or global platform.');
        }

        const rawRules = activePlan.rules;
        if (rawRules.length === 0) {
            throw new ValidationError(`Commission plan ${activePlan.id} has no rules.`);
        }

        const sortableRules = rawRules.map(r => ({
            id: r.id,
            scope: r.scope,
            matchType: r.matchType,
            priority: r.priority,
            createdAt: r.createdAt,
            categoryId: r.category,
            brandId: r.brand,
            ratePercentage: r.ratePercentage,
            fixedFee: r.fixedFee
        }));

        // === 5. Resolve Rules and Calculate ===
        let totalAppliedRate = new Prisma.Decimal(0);
        let totalAppliedFixed = new Prisma.Decimal(0);
        let cumulativeCommission = new Prisma.Decimal(0);
        const precision = activePlan.precision;
        const roundingMode: any = activePlan.roundingMode;
        let matchedRulesCount = 0;

        for (const item of order.networkItems) {
            const globalProduct = await tx.globalProduct.findUnique({
                where: { id: item.globalProductId }
            });

            const rule = resolveRuleForLine(
                globalProduct?.categoryId || null,
                globalProduct?.brandId || null,
                sortableRules
            );

            if (!rule) {
                throw new ValidationError(`No matching commission rule found for global product ${item.globalProductId}.`);
            }

            totalAppliedRate = totalAppliedRate.add(rule.ratePercentage);
            totalAppliedFixed = totalAppliedFixed.add(rule.fixedFee);
            matchedRulesCount++;

            const lineFee = calculateLineCommission(
                item.price,
                item.qty,
                rule.ratePercentage,
                rule.fixedFee,
                precision,
                roundingMode
            );

            cumulativeCommission = cumulativeCommission.add(lineFee);
        }

        const avgRate = matchedRulesCount > 0 ? totalAppliedRate.div(matchedRulesCount) : new Prisma.Decimal(0);
        const avgFixed = matchedRulesCount > 0 ? totalAppliedFixed.div(matchedRulesCount) : new Prisma.Decimal(0);

        // === 6. Snapshot Insert ===
        const snapshot = await tx.commissionSnapshot.create({
            data: {
                tenantId,
                networkOrderId,
                planId: activePlan.id,
                appliedRate: avgRate,
                appliedFixedFee: avgFixed,
                totalCommission: cumulativeCommission
            }
        });

        // === 7. Success Mark ===
        await tx.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: 'SUCCEEDED', completedAt: new Date() }
        });

        return snapshot;
    });
}
