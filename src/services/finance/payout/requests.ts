import { PrismaClient, PayoutRequestStatus } from '@prisma/client';
import { PayoutError } from './errors';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function createPayoutRequest(params: {
    sellerTenantId: string;
    destinationId: string;
    amount: number;
    currency: string;
    idempotencyKey?: string;
    userId: string;
}) {
    const { sellerTenantId, destinationId, amount, currency, userId } = params;

    if (amount <= 0) throw new PayoutError('Amount must be greater than 0', 'INVALID_AMOUNT');

    const dest = await prisma.payoutDestination.findFirst({
        where: { id: destinationId, sellerTenantId, status: 'ACTIVE' }
    });
    if (!dest) throw new PayoutError('Destination not found or inactive', 'INVALID_DESTINATION');

    const ledger = await prisma.ledgerAccount.findUnique({
        where: { companyId: sellerTenantId }
    });
    if (!ledger) throw new PayoutError('Ledger account not found', 'LEDGER_NOT_FOUND');

    if (Number(ledger.availableBalance) < amount) {
        throw new PayoutError('Insufficient available balance', 'INSUFFICIENT_FUNDS');
    }

    const idemKey = params.idempotencyKey || `PAYOUT_REQ:${sellerTenantId}:${destinationId}:${amount}:${currency}:${crypto.randomUUID()}`;

    try {
        const req = await prisma.payoutRequest.create({
            data: {
                sellerTenantId,
                destinationId,
                amount,
                currency,
                status: 'REQUESTED',
                idempotencyKey: idemKey,
                createdByUserId: userId
            }
        });
        return req;
    } catch (err: any) {
        if (err.code === 'P2002') {
            // Idempotency hit
            return prisma.payoutRequest.findUnique({ where: { idempotencyKey: idemKey } });
        }
        throw err;
    }
}

export async function approvePayoutRequest(params: {
    adminUserId: string;
    payoutRequestId: string;
}) {
    const { adminUserId, payoutRequestId } = params;

    const req = await prisma.payoutRequest.findUnique({ where: { id: payoutRequestId } });
    if (!req) throw new PayoutError('Payout request not found', 'NOT_FOUND', 404);
    if (req.status !== 'REQUESTED') throw new PayoutError('Payout request is not in REQUESTED status', 'INVALID_STATUS');

    const updated = await prisma.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedByUserId: adminUserId
        }
    });

    await prisma.financeAuditLog.create({
        data: {
            tenantId: updated.sellerTenantId,
            actor: 'PLATFORM_ADMIN',
            action: 'PAYOUT_APPROVED' as any,
            entityId: updated.id,
            entityType: 'PayoutRequest',
            payloadJson: { previousStatus: req.status, newStatus: updated.status, adminUserId }
        }
    });

    return updated;
}

export async function rejectPayoutRequest(params: {
    adminUserId: string;
    payoutRequestId: string;
    reason?: string;
}) {
    const { adminUserId, payoutRequestId, reason } = params;

    const req = await prisma.payoutRequest.findUnique({ where: { id: payoutRequestId } });
    if (!req) throw new PayoutError('Payout request not found', 'NOT_FOUND', 404);
    if (req.status !== 'REQUESTED' && req.status !== 'APPROVED') {
        throw new PayoutError(`Cannot reject payout in status ${req.status}`, 'INVALID_STATUS');
    }

    const updated = await prisma.payoutRequest.update({
        where: { id: payoutRequestId },
        data: {
            status: 'REJECTED',
            note: reason || 'Rejected by Admin'
        }
    });

    await prisma.financeAuditLog.create({
        data: {
            tenantId: updated.sellerTenantId,
            actor: 'PLATFORM_ADMIN',
            action: 'PAYOUT_REJECTED' as any,
            entityId: updated.id,
            entityType: 'PayoutRequest',
            payloadJson: { reason, adminUserId }
        }
    });

    return updated;
}
