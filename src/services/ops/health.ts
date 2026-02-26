import { PrismaClient, OpsHealthSnapshotScope } from '@prisma/client';

const prisma = new PrismaClient();

export async function computeOpsHealth(params: { now?: Date } = {}) {
    const now = params.now || new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);
    const tenMinsAgo = new Date(now.getTime() - 10 * 60000);

    const counts = {
        payoutOutboxPending: await prisma.payoutOutbox.count({ where: { status: 'PENDING' } }),
        payoutOutboxSendingStuck: await prisma.payoutOutbox.count({ 
            where: { status: 'SENDING', updatedAt: { lt: fifteenMinsAgo } } 
        }),
        providerPayoutQueued: await prisma.providerPayout.count({ where: { status: 'QUEUED' } }),
        providerPayoutSentStuck10m: await prisma.providerPayout.count({ 
            where: { status: 'SENT', updatedAt: { lt: tenMinsAgo } } 
        }),
        providerPayoutReconcileRequired: await prisma.providerPayout.count({ 
            where: { status: 'RECONCILE_REQUIRED' } 
        }),
        integrityAlertsCriticalOpen: await prisma.financeIntegrityAlert.count({ 
            where: { severity: 'CRITICAL', resolvedAt: null } 
        }),
        integrityAlertsWarningOpen: await prisma.financeIntegrityAlert.count({ 
            where: { severity: 'WARNING', resolvedAt: null } 
        })
    };

    const oldestPending = await prisma.payoutOutbox.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' }
    });
    
    const oldestSent = await prisma.providerPayout.findFirst({
         where: { status: 'SENT' },
         orderBy: { updatedAt: 'asc' }
    });

    const lagMetrics = {
        maxOutboxAgeMinutes: oldestPending ? Math.floor((now.getTime() - oldestPending.createdAt.getTime()) / 60000) : 0,
        maxSentAgeMinutes: oldestSent ? Math.floor((now.getTime() - oldestSent.updatedAt.getTime()) / 60000) : 0
    };

    const getLastRun = async (actionContains: string) => {
         const log = await prisma.financeOpsLog.findFirst({
              where: { action: { contains: actionContains } },
              orderBy: { createdAt: 'desc' }
         });
         return log ? log.createdAt.toISOString() : null;
    };

    const lastRunTimestamps = {
        lastOutboxRunAt: await getLastRun('OUTBOX_RUN'), // assuming run endpoints log this
        lastReconcilePullAt: await getLastRun('RECONCILE_FIX'), // or RECONCILE_PULL_RUN
        lastRepairAt: await getLastRun('STUCK_OUTBOX_RESET'), // or REPAIR_RUN
        lastSentinelAt: await getLastRun('SENTINEL_SCAN')
    };

    const topCriticalAlerts = await prisma.financeIntegrityAlert.findMany({
        where: { severity: 'CRITICAL', resolvedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, referenceId: true, createdAt: true }
    });

    return {
        timestamp: now.toISOString(),
        counts,
        lagMetrics,
        lastRunTimestamps,
        topCriticalAlerts
    };
}

export async function saveOpsHealthSnapshot(params: {
    scope: OpsHealthSnapshotScope;
    payloadJson: any;
}) {
    return prisma.opsHealthSnapshot.create({
        data: {
            scope: params.scope,
            payloadJson: params.payloadJson
        }
    });
}
