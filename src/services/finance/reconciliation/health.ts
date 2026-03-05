import { prisma } from "@/lib/prisma";

export async function computeHealthForAccount(accountId: string) {
    const recon = await prisma.reconciliation.findFirst({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        include: { disputes: { where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } } }
    });

    if (!recon) return 'MISSING';

    // Check disputes first (most severe active block)
    if (recon.disputes && recon.disputes.length > 0) return 'DISPUTED';
    if (recon.status === 'DISPUTED' || recon.status === 'REJECTED') return 'DISPUTED';

    if (recon.status === 'SIGNED') return 'OK';

    // OVERDUE logic (if un-signed and past due)
    if (['SENT', 'VIEWED', 'SIGNING'].includes(recon.status) && recon.dueAt && new Date() > recon.dueAt) {
        return 'OVERDUE';
    }

    if (recon.status === 'EXPIRED') return 'OVERDUE';

    return 'OK'; // Pending signing but not overdue is technically OK for gate, or maybe another state, but MVP translates to OK as non-blocking
}

export async function getAccountReconStatus(accountId: string) {
    let status = await prisma.accountReconciliationStatus.findUnique({
        where: { accountId }
    });

    if (!status) {
        status = await updateAccountReconStatus(accountId);
    }

    return status;
}

export async function updateAccountReconStatus(accountId: string) {
    const recon = await prisma.reconciliation.findFirst({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        include: { disputes: { where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } } }
    });

    if (!recon) {
        const tenant = await prisma.customer.findUnique({ where: { id: accountId }, select: { companyId: true } });
        if (!tenant) throw new Error("Customer not found");

        return await prisma.accountReconciliationStatus.upsert({
            where: { accountId },
            create: {
                tenantId: tenant.companyId,
                accountId,
                health: 'MISSING'
            },
            update: {
                health: 'MISSING'
            }
        });
    }

    const health = await computeHealthForAccount(accountId);
    const overdueDays = (health === 'OVERDUE' && recon.dueAt)
        ? Math.max(0, Math.floor((new Date().getTime() - recon.dueAt.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    return await prisma.accountReconciliationStatus.upsert({
        where: { accountId },
        create: {
            tenantId: recon.tenantId,
            accountId,
            lastSignedAt: recon.status === 'SIGNED' ? recon.signedAt : null,
            lastSentAt: ['SENT', 'VIEWED', 'SIGNING'].includes(recon.status) ? recon.sentAt : null,
            lastReconId: recon.id,
            health: health as any,
            overdueDays,
            hasOpenDispute: (recon.disputes && recon.disputes.length > 0) || recon.status === 'DISPUTED'
        },
        update: {
            lastSignedAt: recon.status === 'SIGNED' ? recon.signedAt : undefined, // Keep previous if null
            lastSentAt: recon.sentAt,
            lastReconId: recon.id,
            health: health as any,
            overdueDays,
            hasOpenDispute: (recon.disputes && recon.disputes.length > 0) || recon.status === 'DISPUTED'
        }
    });
}
