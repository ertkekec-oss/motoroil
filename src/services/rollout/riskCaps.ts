import { PrismaClient, Prisma } from '@prisma/client';

export class EscrowValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EscrowValidationError';
    }
}

export async function assertWithinGmvLimit(params: {
    prisma: PrismaClient | Prisma.TransactionClient;
    tenantId: string;
    amount: number;
    dayStr: string;
}) {
    const policy = await params.prisma.tenantRolloutPolicy.findUnique({
        where: { tenantId: params.tenantId }
    });

    if (!policy || !policy.maxDailyGmv) return; // No limit

    const limit = Number(policy.maxDailyGmv);
    
    // Instead of querying metrics, we query actual payments for total accuracy in the moment.
    const start = new Date(`${params.dayStr}T00:00:00+03:00`);
    const end = new Date(`${params.dayStr}T00:00:00+03:00`);
    end.setUTCDate(end.getUTCDate() + 1);

    const payments = await params.prisma.providerPayment.aggregate({
         _sum: { amount: true },
         where: { tenantId: params.tenantId, status: 'PAID', createdAt: { gte: start, lt: end } }
    });

    const currentTotal = Number(payments._sum.amount || 0);
    const newTotal = currentTotal + params.amount;

    if (newTotal > limit) {
        await logPolicyViolation(params.prisma, params.tenantId, 'DAILY_GMV_LIMIT_EXCEEDED');
        throw new EscrowValidationError(`DAILY_GMV_LIMIT_EXCEEDED: ${newTotal} > ${limit}`);
    }
}

export async function assertWithinSingleOrderLimit(params: {
    prisma: PrismaClient | Prisma.TransactionClient;
    tenantId: string;
    amount: number;
}) {
    const policy = await params.prisma.tenantRolloutPolicy.findUnique({
        where: { tenantId: params.tenantId }
    });

    if (!policy || !policy.maxSingleOrderAmount) return;

    if (params.amount > Number(policy.maxSingleOrderAmount)) {
        await logPolicyViolation(params.prisma, params.tenantId, 'SINGLE_ORDER_LIMIT_EXCEEDED');
        throw new EscrowValidationError('SINGLE_ORDER_LIMIT_EXCEEDED');
    }
}

export async function assertWithinPayoutLimit(params: {
    prisma: PrismaClient | Prisma.TransactionClient;
    tenantId: string;
    amount: number;
    dayStr: string;
}) {
    const policy = await params.prisma.tenantRolloutPolicy.findUnique({
        where: { tenantId: params.tenantId }
    });

    if (!policy || !policy.maxDailyPayout) return; 

    // Find sum of SUCCESS and SENT and QUEUED payouts to be safe against double enqueuing
    const start = new Date(`${params.dayStr}T00:00:00+03:00`);
    const end = new Date(`${params.dayStr}T00:00:00+03:00`);
    end.setUTCDate(end.getUTCDate() + 1);

    const payouts = await params.prisma.providerPayout.aggregate({
         _sum: { netAmount: true },
         where: { sellerTenantId: params.tenantId, createdAt: { gte: start, lt: end }, status: { in: ['QUEUED', 'SENT', 'SUCCEEDED', 'RECONCILE_REQUIRED'] } }
    });

    const currentTotal = Number(payouts._sum.netAmount || 0);
    const limit = Number(policy.maxDailyPayout);

    if (currentTotal + params.amount > limit) {
         await logPolicyViolation(params.prisma, params.tenantId, 'DAILY_PAYOUT_LIMIT_EXCEEDED');
         throw new EscrowValidationError(`DAILY_PAYOUT_LIMIT_EXCEEDED: limit ${limit}`);
    }
}

export async function assertEscrowNotPaused(params: {
    prisma: PrismaClient | Prisma.TransactionClient;
    tenantId: string;
}) {
    const policy = await params.prisma.tenantRolloutPolicy.findUnique({
        where: { tenantId: params.tenantId }
    });

    if (policy?.escrowPaused) {
        await logPolicyViolation(params.prisma, params.tenantId, 'ESCROW_PAUSED');
        throw new EscrowValidationError('ESCROW_PAUSED');
    }
}

export async function assertPayoutNotPaused(params: {
    prisma: PrismaClient | Prisma.TransactionClient;
    tenantId: string;
}) {
    const policy = await params.prisma.tenantRolloutPolicy.findUnique({
        where: { tenantId: params.tenantId }
    });

    if (policy?.payoutPaused) {
        await logPolicyViolation(params.prisma, params.tenantId, 'PAYOUT_PAUSED');
        throw new EscrowValidationError('PAYOUT_PAUSED');
    }
}

async function logPolicyViolation(prisma: any, tenantId: string, rule: string) {
    // Cannot be part of same tx if it throws, so we spawn floating or use separate client in real flow
    // For test simplicity, we just create it on the tx, but warning: throwing error rolls back this log.
    // In production, we'd fire an event or log outside tx bound. To be safe, we use base PrismaClient to ensure log persists even if caller throws.
    const rootPrisma = new PrismaClient();
    await rootPrisma.financeOpsLog.create({
        data: {
            action: 'POLICY_VIOLATION',
            entityType: 'TenantRolloutPolicy',
            entityId: tenantId,
            severity: 'WARNING',
            payloadJson: { rule }
        }
    }).catch(() => {});
}
