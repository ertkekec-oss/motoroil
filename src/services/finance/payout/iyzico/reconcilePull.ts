import { PrismaClient } from '@prisma/client';
import { finalizePayoutLedger } from '../ledgerFinalize';
import { PaymentProvider } from '../providers/types';
import { MockProvider } from '../providers/mockProvider';

const prisma = new PrismaClient();
const getProvider = (): PaymentProvider => new MockProvider(); // Inject REAL provider in prod

export async function runProviderPayoutReconcileCycle(params: { now?: Date, batchSize?: number } = {}) {
    const now = params.now || new Date();
    const batchSize = params.batchSize || 10;
    const provider = getProvider();

    const tenMinsAgo = new Date(now.getTime() - 10 * 60000);

    const payouts = await prisma.providerPayout.findMany({
        where: {
            status: 'SENT',
            updatedAt: { lt: tenMinsAgo }
        },
        take: batchSize
    });

    let correctedCount = 0;

    for (const payout of payouts) {
        // Query provider
        let statusResp;
        try {
             statusResp = await provider.getPayoutStatus(payout.providerPayoutId);
        } catch(e) {
             continue; // Skip if provider throws (timeout etc)
        }

        if (statusResp.status === 'SUCCEEDED') {
            await prisma.providerPayout.update({
                where: { id: payout.id },
                data: { status: 'SUCCEEDED' },
            });
            
            // Try finalizing ledger
            await finalizePayoutLedger({ providerPayoutId: payout.providerPayoutId });
            
            await prisma.financeOpsLog.create({
                data: {
                    action: 'RECONCILE_FIX',
                    entityType: 'ProviderPayout',
                    entityId: payout.id,
                    severity: 'INFO',
                    payloadJson: { previousStatus: 'SENT', newStatus: 'SUCCEEDED' }
                }
            });
            correctedCount++;
        } else if (statusResp.status === 'FAILED') {
            await prisma.providerPayout.update({
                where: { id: payout.id },
                data: { status: 'FAILED' }
            });

            await prisma.financeOpsLog.create({
                data: {
                    action: 'PAYOUT_FAILED_EXTERNAL',
                    entityType: 'ProviderPayout',
                    entityId: payout.id,
                    severity: 'ERROR',
                    payloadJson: { previousStatus: 'SENT', newStatus: 'FAILED' }
                }
            });
            correctedCount++;
        }
    }

    return { success: true, correctedCount };
}
