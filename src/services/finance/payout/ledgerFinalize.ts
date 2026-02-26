import { PrismaClient, Prisma } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';
import { PayoutError } from './errors';

const prisma = new PrismaClient();

export async function finalizePayoutLedger(params: {
    providerPayoutId: string;
}) {
    const { providerPayoutId } = params;
    const idempotencyKey = `PAYOUT_FINALIZE:${providerPayoutId}`;

    return await withIdempotency(
        prisma,
        idempotencyKey,
        'FIN_PAYOUT',
        'SYSTEM',
        async (tx) => {
            const payout = await tx.providerPayout.findUnique({
                where: { providerPayoutId }
            });

            if (!payout) throw new PayoutError('Payout record not found', 'NOT_FOUND', 404);
            // Must be SUCCEEDED based on provider feedback
            if (payout.status !== 'SUCCEEDED') throw new PayoutError(`Cannot finalize in status ${payout.status}`, 'INVALID_STATUS');

            // 1. LedgerGroup
            const group = await tx.ledgerGroup.create({
                data: {
                    idempotencyKey,
                    tenantId: payout.sellerTenantId, // Primary actor
                    type: 'IYZICO_PAYOUT_FINALIZE',
                    description: `Release Payout Completed ${providerPayoutId}`
                }
            });

            // 2. Platform Commission Booking
            // In a real system you'd find platform's ledgerAccountId here.
            // Pseudo platform string ID: 'PLATFORM_LEDGER'
            // We just create Entries (no rigid constraint exists preventing creating them)

            // Commission
            await tx.ledgerEntry.create({
                data: {
                    tenantId: 'PLATFORM',
                    ledgerAccountId: 'PLATFORM_REVENUE_ACCT', // Placeholder
                    groupId: group.id,
                    accountType: 'PLATFORM_REVENUE',
                    direction: 'CREDIT',
                    amount: payout.commissionAmount,
                    currency: payout.currency,
                    refType: 'PROVIDER_PAYOUT',
                    referenceId: payout.id
                }
            });

            // Seller Wallet (if managed). Real funds leaving Escrow for Seller.
            const sellerLedger = await tx.ledgerAccount.findUnique({
                where: { companyId: payout.sellerTenantId }
            });

            if (sellerLedger) {
                // If it was already on their available balance, remove from available. 
                // Alternatively, log as External Payout.
                await tx.ledgerEntry.create({
                    data: {
                        tenantId: payout.sellerTenantId,
                        ledgerAccountId: sellerLedger.id,
                        groupId: group.id,
                        accountType: 'SELLER_PAYOUT_OUT',
                        direction: 'CREDIT',
                        amount: payout.netAmount,
                        currency: payout.currency,
                        refType: 'PROVIDER_PAYOUT',
                        referenceId: payout.id
                    }
                });
            }

            // 3. Mark Earning as fully released if shipmentId was mapped
            if (payout.shipmentId || payout.sellerEarningId) {
                // Logic to update SellerEarning ... (FIN-1 logic bridge)
            }

            // 4. Audit
            await tx.financeAuditLog.create({
                data: {
                    tenantId: payout.sellerTenantId,
                    actor: 'PLATFORM_SYSTEM',
                    action: 'PAYOUT_FINALIZED' as any,
                    entityId: payout.id,
                    entityType: 'ProviderPayout',
                    payloadJson: { netAmount: payout.netAmount, comm: payout.commissionAmount }
                }
            });

            return { success: true, groupId: group.id };
        },
        (res) => res.groupId
    ).catch(e => {
        if (e.message === 'ALREADY_SUCCEEDED') {
            return { success: true, message: 'Already processed' };
        }
        throw e;
    });
}
