"use server";

import { prisma } from "@/lib/prisma";

export async function getReconciliationStats(tenantId: string) {
    // Overdue is sentAt/viewedAt < X days, configurable via policy but let's hardcode 7 for MVP
    const defaultExpiryDays = 7;
    const expiryDate = new Date(Date.now() - defaultExpiryDays * 24 * 60 * 60 * 1000);

    const [totalDraft, pendingSignature, signed, overdue, disputed] = await Promise.all([
        prisma.reconciliation.count({
            where: { tenantId, status: { in: ['DRAFT', 'GENERATED'] } }
        }),
        prisma.reconciliation.count({
            where: { tenantId, status: { in: ['SENT', 'VIEWED', 'SIGNING'] } }
        }),
        prisma.reconciliation.count({
            where: { tenantId, status: 'SIGNED' }
        }),
        prisma.reconciliation.count({
            where: {
                tenantId,
                status: { in: ['SENT', 'VIEWED', 'SIGNING'] },
                dueAt: { lt: new Date() } // Simple due date check
            }
        }),
        prisma.reconciliation.count({
            where: { tenantId, status: { in: ['DISPUTED', 'REJECTED'] } }
        })
    ]);

    return { totalDraft, pendingSignature, signed, overdue, disputed };
}

export async function listReconciliations(tenantId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const data = await prisma.reconciliation.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
            customer: { select: { name: true, taxNumber: true } },
            snapshot: true,
            auditEvents: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    const totalCount = await prisma.reconciliation.count({ where: { tenantId } });

    return {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page
    };
}
