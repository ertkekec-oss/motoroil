import { PrismaClient } from '@prisma/client';
import { PayoutError } from '../errors';
import { MockProvider } from '../providers/mockProvider';
import { decryptIban } from '../pii';
import { PaymentProvider } from '../providers/types';

const prisma = new PrismaClient();
// For production, inject the real IyzicoProvider via env or DI
const getProvider = (): PaymentProvider => new MockProvider();

export async function createOrUpdateSubMerchantForSeller(
    sellerTenantId: string,
    payoutDestinationId: string,
    legalInfoMinimal: any = {}
) {
    const provider = getProvider();

    // 1. Fetch destination
    const dest = await prisma.payoutDestination.findUnique({
        where: { id: payoutDestinationId }
    });

    if (!dest || dest.sellerTenantId !== sellerTenantId || dest.status !== 'ACTIVE') {
        throw new PayoutError('Invalid or inactive payout destination', 'INVALID_DESTINATION');
    }

    const rawIban = decryptIban(dest.ibanEncrypted);

    // 2. Map existing or create new
    return prisma.$transaction(async (tx) => {
        let profile = await tx.sellerPaymentProfile.findUnique({
            where: { sellerTenantId }
        });

        if (profile) {
            // Update provider
            await provider.updateSubMerchant({
                subMerchantKey: profile.subMerchantKey,
                iban: rawIban,
                holderName: 'Redacted Name (from dest)' // Or fetch actual if saved raw
            });

            profile = await tx.sellerPaymentProfile.update({
                where: { id: profile.id },
                data: { status: 'ACTIVE' }
            });

            await tx.financeAuditLog.create({
                data: {
                    tenantId: sellerTenantId,
                    actor: 'PLATFORM_SYSTEM',
                    action: 'SELLER_SUBMERCHANT_LINKED' as any,
                    entityId: profile.id,
                    entityType: 'SellerPaymentProfile',
                    payloadJson: { updated: true, provider: 'IYZICO' }
                }
            });

            return profile;
        } else {
            // Create in provider
            const { subMerchantKey } = await provider.createSubMerchant({
                sellerTenantId,
                iban: rawIban,
                holderName: 'Redacted Name',
                legalInfoMinimal
            });

            profile = await tx.sellerPaymentProfile.create({
                data: {
                    sellerTenantId,
                    provider: 'IYZICO',
                    subMerchantKey,
                    status: 'ACTIVE'
                }
            });

            await tx.financeAuditLog.create({
                data: {
                    tenantId: sellerTenantId,
                    actor: 'PLATFORM_SYSTEM',
                    action: 'SELLER_SUBMERCHANT_LINKED' as any,
                    entityId: profile.id,
                    entityType: 'SellerPaymentProfile',
                    payloadJson: { provider: 'IYZICO' }
                }
            });

            return profile;
        }
    });
}
