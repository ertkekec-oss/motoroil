import { prisma } from "@/lib/prisma";
import { updateAccountReconStatus } from "./health";

export async function checkReconciliationExpirations() {
    // 1. Fetch overdue
    const overdueRecons = await prisma.reconciliation.findMany({
        where: {
            status: { in: ['SENT', 'VIEWED', 'SIGNING'] },
            dueAt: { lt: new Date() }
        },
        select: { id: true, accountId: true, tenantId: true }
    });

    if (overdueRecons.length === 0) return 0;

    // 2. Mark EXPIRED
    await prisma.reconciliation.updateMany({
        where: { id: { in: overdueRecons.map(r => r.id) } },
        data: { status: 'EXPIRED' }
    });

    // 3. Write Audit Events & Update Account Status
    for (const recon of overdueRecons) {
        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                action: 'EXPIRED',
                metaJson: { trigger: 'Watcher' }
            }
        });

        // Write-through to health table
        await updateAccountReconStatus(recon.accountId);
    }

    return overdueRecons.length;
}
