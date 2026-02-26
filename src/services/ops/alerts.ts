import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ackAlert(params: {
    adminUserId: string;
    alertType: string;
    alertId: string;
    note: string;
}) {
    const { adminUserId, alertType, alertId, note } = params;

    const ack = await prisma.opsAlertAck.upsert({
        where: {
             alertType_alertId: { alertType, alertId }
        },
        update: {
             acknowledgedByUserId: adminUserId,
             note,
             acknowledgedAt: new Date()
        },
        create: {
             alertType,
             alertId,
             acknowledgedByUserId: adminUserId,
             note
        }
    });

    await prisma.financeOpsLog.create({
        data: {
            action: 'ALERT_ACKED',
            entityType: 'Alert',
            entityId: alertId,
            severity: 'INFO',
            payloadJson: { adminUserId, note }
        }
    });

    return { success: true, ack };
}

export async function resolveIntegrityAlert(params: {
    adminUserId: string;
    alertId: string;
    note: string;
}) {
    const { adminUserId, alertId, note } = params;

    const alert = await prisma.financeIntegrityAlert.update({
        where: { id: alertId },
        data: { resolvedAt: new Date() }
    });

    await prisma.financeOpsLog.create({
        data: {
            action: 'ALERT_RESOLVED',
            entityType: 'FinanceIntegrityAlert',
            entityId: alertId,
            severity: 'INFO',
            payloadJson: { adminUserId, note }
        }
    });

    return { success: true, alert };
}

export async function escalateAlertsIfNeeded(params: { now?: Date } = {}) {
     const now = params.now || new Date();
     const tenMinsAgo = new Date(now.getTime() - 10 * 60000);

     // Elevate FINALIZE_MISSING older than 10m to CRITICAL
     const escalatedMissing = await prisma.financeIntegrityAlert.updateMany({
         where: {
             type: 'FINALIZE_MISSING',
             severity: 'WARNING',
             createdAt: { lt: tenMinsAgo },
             resolvedAt: null
         },
         data: { severity: 'CRITICAL' }
     });

     // LEDGER_UNBALANCED is already CRITICAL immediately by sentinel

     // Log escalation if any
     if (escalatedMissing.count > 0) {
          await prisma.financeOpsLog.create({
               data: {
                    action: 'ALERTS_ESCALATED',
                    entityType: 'FinanceIntegrityAlert',
                    severity: 'WARNING',
                    payloadJson: { count: escalatedMissing.count, to: 'CRITICAL', rule: 'FINALIZE_MISSING > 10m' }
               }
          });
     }

     return { success: true, escalatedMissingCount: escalatedMissing.count };
}
