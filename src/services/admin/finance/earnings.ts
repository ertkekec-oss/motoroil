import { PrismaClient } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';
import { createFinanceAuditLog } from './audit';
import { releaseSingleEarning } from '../../finance/earnings/releaseSingle';

const prisma = new PrismaClient();

export async function adminOverrideEarningRelease(
    adminUserId: string,
    earningId: string,
    reason?: string
) {
    return withIdempotency(
        prisma,
        `ADMIN_EARNING_RELEASE:${earningId}`,
        'EARNING_RELEASE_OVERRIDE',
        'PLATFORM_TENANT_CONST',
        async (tx) => {
            const earning = await tx.sellerEarning.findUnique({
                where: { id: earningId }
            });

            if (!earning) {
                throw new Error('Earning not found');
            }

            if (earning.status === 'RELEASED') {
                throw new Error('Earning is already released');
            }

            // If it's not time yet, we align its expectedClearDate so the core engine allows it.
            // We do this inside this transaction to guarantee it's ready for the engine.
            if (!earning.expectedClearDate || earning.expectedClearDate > new Date()) {
                await tx.sellerEarning.update({
                    where: { id: earningId },
                    data: { expectedClearDate: new Date() }
                });
            }

            // Audit logging
            await createFinanceAuditLog(
                tx,
                'EARNING_MANUAL_RELEASE',
                adminUserId,
                earningId,
                'SellerEarning',
                { reason: reason || 'Manual Admin Override', previousClearDate: earning.expectedClearDate }
            );

            // We return earning. The actual release will be done sequentially outside this
            // transaction since releaseSingleEarning creates its own transaction.
            return earning;
        }
    );
}
