import { PrismaClient } from '@prisma/client';
import { PayoutError } from './errors';
import { withIdempotency } from '../../../lib/idempotency';
import { createPayoutLedgerEntries } from './ledgerPosting';

const prisma = new PrismaClient();

export async function processPayoutRequestInternal(params: {
    payoutRequestId: string;
    adminUserId?: string;
}) {
    const { payoutRequestId, adminUserId } = params;
    const idempotencyKey = `PAYOUT_PROCESS:${payoutRequestId}`;

    try {
        const result = await withIdempotency(
            prisma,
            idempotencyKey,
            'FIN_PAYOUT',
            'SYSTEM',
            async (tx) => {
                const req = await tx.payoutRequest.findUnique({
                    where: { id: payoutRequestId },
                    include: { sellerCompany: true }
                });

                if (!req) throw new PayoutError('Request not found', 'NOT_FOUND', 404);
                if (req.status !== 'APPROVED') {
                    throw new PayoutError(`Cannot process request in status ${req.status}`, 'INVALID_STATUS');
                }

                const ledger = await tx.ledgerAccount.findUnique({
                    where: { companyId: req.sellerTenantId }
                });

                if (!ledger) throw new PayoutError('Ledger account not found', 'LEDGER_NOT_FOUND');

                if (Number(ledger.availableBalance) < Number(req.amount)) {
                    throw new PayoutError('Insufficient funds at processing time', 'INSUFFICIENT_FUNDS');
                }

                await tx.payoutRequest.update({
                    where: { id: payoutRequestId },
                    data: { status: 'PROCESSING' }
                });

                await createPayoutLedgerEntries(tx, {
                    sellerTenantId: req.sellerTenantId,
                    ledgerAccountId: ledger.id,
                    amount: req.amount,
                    currency: req.currency,
                    idempotencyKey,
                    refId: req.id
                });

                const finalReq = await tx.payoutRequest.update({
                    where: { id: payoutRequestId },
                    data: {
                        status: 'PAID_INTERNAL',
                        processedAt: new Date()
                    }
                });

                if (adminUserId) {
                    await tx.financeAuditLog.create({
                        data: {
                            tenantId: req.sellerTenantId,
                            actor: 'PLATFORM_ADMIN',
                            action: 'PAYOUT_PROCESSED_INTERNAL' as any,
                            entityId: req.id,
                            entityType: 'PayoutRequest',
                            payloadJson: { amount: req.amount, currency: req.currency, adminUserId }
                        }
                    });
                }

                return finalReq;
            },
            (res) => res.id
        );
        return result;
    } catch (e: any) {
        if (e.message === 'ALREADY_SUCCEEDED') {
            return prisma.payoutRequest.findUnique({ where: { id: payoutRequestId } });
        }

        if (e instanceof PayoutError && e.code === 'INSUFFICIENT_FUNDS') {
            await failPayoutRequest(payoutRequestId, e.code, e.message, adminUserId);
        }
        throw e;
    }
}

async function failPayoutRequest(id: string, code: string, msg: string, adminUserId?: string) {
    const r = await prisma.payoutRequest.findUnique({ where: { id } });
    if (r && ['REQUESTED', 'APPROVED', 'PROCESSING'].includes(r.status)) {
        await prisma.payoutRequest.update({
            where: { id },
            data: { status: 'FAILED', failureCode: code, failureMessage: msg }
        });

        if (adminUserId) {
            await prisma.financeAuditLog.create({
                data: {
                    tenantId: r.sellerTenantId,
                    actor: 'PLATFORM_ADMIN',
                    action: 'PAYOUT_FAILED' as any,
                    entityId: r.id,
                    entityType: 'PayoutRequest',
                    payloadJson: { code, msg, adminUserId }
                }
            });
        }
    }
}
