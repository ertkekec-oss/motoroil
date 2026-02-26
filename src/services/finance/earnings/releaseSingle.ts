import { prisma } from '@/lib/prisma';
import { EarningStatus } from '@prisma/client';
import { NotFoundError, ValidationError, AlreadyRunningError } from './errors';
import { assertEscrowAvailable } from './escrowGuard';
import { createReleaseLedgerEntries } from './ledgerPosting';

export async function releaseSingleEarning(earningId: string): Promise<void> {
    const idempotencyKey = `EARNING_RELEASE:earning:${earningId}`;
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000); // 15 mins

    await prisma.$transaction(async (tx) => {
        // === 1. Lock Idempotency ===
        let record = await tx.idempotencyRecord.findUnique({
            where: { key: idempotencyKey }
        });

        if (record) {
            if (record.status === 'SUCCEEDED') {
                return; // No-op, already released
            }

            if (record.status === 'STARTED' && record.lockedAt > cutoffTime) {
                throw new AlreadyRunningError(`Release process is already running for earning ${earningId}`);
            }

            // Stale lock takeover
            await tx.idempotencyRecord.update({
                where: { key: idempotencyKey },
                data: { status: 'STARTED', lockedAt: new Date() }
            });
        } else {
            const earning = await tx.sellerEarning.findUnique({ where: { id: earningId } });
            if (!earning) throw new NotFoundError('Earning not found before locking');

            await tx.idempotencyRecord.create({
                data: {
                    key: idempotencyKey,
                    scope: 'EARNING_RELEASE',
                    tenantId: earning.sellerCompanyId,
                    status: 'STARTED',
                    lockedAt: new Date()
                }
            });
        }

        // === 2. Double check state inside lock ===
        const earning = await tx.sellerEarning.findUnique({
            where: { id: earningId },
        });

        if (!earning) {
            throw new NotFoundError(`Seller earning ${earningId} not found`);
        }

        if (earning.status === EarningStatus.RELEASED) {
            // Should be covered by idempotency, but safe backup 
            await tx.idempotencyRecord.update({
                where: { key: idempotencyKey },
                data: { status: 'SUCCEEDED', completedAt: new Date() }
            });
            return;
        }

        if (earning.status !== EarningStatus.CLEARED && earning.status !== EarningStatus.PENDING) {
            throw new ValidationError(`Cannot release earning ${earningId} in status ${earning.status}`);
        }

        // Check if expectedClearDate is breached (now >= expectedClearDate).
        if (!earning.expectedClearDate || earning.expectedClearDate > new Date()) {
            throw new ValidationError(`Earning ${earningId} is not eligible for release yet.`);
        }

        // === 3. Escrow Guard (Network Payment Must Be Paid) ===
        await assertEscrowAvailable(tx, earning.shipmentId);

        // === 4. Perform Double-Entry Ledger Postings ===
        // This strictly applies tenant-scoped entries
        await createReleaseLedgerEntries(tx, idempotencyKey, {
            grossAmount: earning.grossAmount,
            commissionAmount: earning.commissionAmount,
            chargebackAmount: earning.chargebackAmount,
            netPayable: earning.netAmount,
            currency: earning.currency,
            refType: 'SHIPMENT',
            refId: earning.shipmentId,
            sellerTenantId: earning.sellerCompanyId
        });

        // === 5. Update Status ===
        await tx.sellerEarning.update({
            where: { id: earningId },
            data: {
                status: EarningStatus.RELEASED,
                releasedAt: new Date(),
                updatedAt: new Date()
            }
        });

        // === 6. Idempotency Success ===
        await tx.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: 'SUCCEEDED', completedAt: new Date() }
        });
    });
}
