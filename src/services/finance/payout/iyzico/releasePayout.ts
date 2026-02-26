import { PrismaClient } from '@prisma/client';
import { PayoutError } from '../errors';

const prisma = new PrismaClient();

export async function enqueueReleasePayout(params: {
    shipmentId: string;
    sellerTenantId: string;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
}) {
    const { shipmentId, sellerTenantId, grossAmount, commissionAmount, netAmount } = params;

    const idempotencyKey = `IYZICO_PAYOUT:shipment:${shipmentId}`;
    const providerPayoutId = `PO_${Date.now()}_${shipmentId.substring(0, 8)}`;

    return prisma.$transaction(async (tx) => {
        // Idempotency check
        const existingPayout = await tx.providerPayout.findUnique({
            where: { idempotencyKey }
        });

        if (existingPayout) return existingPayout;

        // Ensure submerchant profile exists
        const profile = await tx.sellerPaymentProfile.findUnique({
            where: { sellerTenantId }
        });

        if (!profile || profile.status !== 'ACTIVE') {
            throw new PayoutError('Seller not onboarded for payments or submerchant profile inactive.', 'NOT_ONBOARDED');
        }

        const payout = await tx.providerPayout.create({
            data: {
                sellerTenantId,
                provider: 'IYZICO',
                providerPayoutId,
                shipmentId,
                grossAmount,
                commissionAmount,
                netAmount,
                currency: 'TRY',
                status: 'QUEUED',
                idempotencyKey
            }
        });

        await tx.payoutOutbox.create({
            data: {
                provider: 'IYZICO',
                idempotencyKey,
                sellerTenantId,
                payloadJson: {
                    grossAmount,
                    commissionAmount,
                    netAmount,
                    subMerchantKey: profile.subMerchantKey,
                    providerPayoutId
                },
                status: 'PENDING'
            }
        });

        await tx.financeAuditLog.create({
            data: {
                tenantId: sellerTenantId,
                actor: 'PLATFORM_SYSTEM',
                action: 'PAYOUT_ENQUEUED' as any,
                entityId: payout.id,
                entityType: 'ProviderPayout',
                payloadJson: { grossAmount, netAmount, shipmentId }
            }
        });

        return payout;
    });
}
