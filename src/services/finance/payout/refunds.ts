import { PrismaClient } from '@prisma/client';
import { PayoutError } from './errors';

const prisma = new PrismaClient();

export async function handleRefundOrChargeback(params: {
    providerPaymentId: string;
    amount: number;
    reason: string;
    isChargeback?: boolean;
}) {
    const { providerPaymentId, amount, reason, isChargeback } = params;

    return prisma.$transaction(async tx => {
        const payment = await tx.providerPayment.findUnique({
            where: { providerPaymentId },
            include: { buyerCompany: true }
        });

        if (!payment) throw new PayoutError('Payment not found', 'NOT_FOUND', 404);

        // Find corresponding payout if released
        const payout = await tx.providerPayout.findFirst({
            where: { netAmount: { gt: 0 } }, // Dummy association logic
            orderBy: { createdAt: 'desc' }
        });

        const statusUpdate = isChargeback ? 'CHARGEBACK' : 'REFUNDED';
        await tx.providerPayment.update({
            where: { id: payment.id },
            data: { status: statusUpdate }
        });

        if (payout && payout.status === 'SUCCEEDED') {
            // Funds released -> Deduct from wallet or create receivable
            const ledger = await tx.ledgerAccount.findUnique({
                where: { companyId: payout.sellerTenantId }
            });

            if (ledger && Number(ledger.availableBalance) >= amount) {
                // Deduct from wallet
                await tx.ledgerAccount.update({
                    where: { id: ledger.id },
                    data: { availableBalance: { decrement: amount } }
                });
            } else {
                // Missing funds -> Receivable workflow placeholder
                console.warn(`Seller ${payout.sellerTenantId} lacks funds for refund/chargeback ${amount}`);
            }

            await tx.financeAuditLog.create({
                data: {
                    tenantId: payout.sellerTenantId,
                    actor: 'PLATFORM_SYSTEM',
                    action: (isChargeback ? 'CHARGEBACK_HANDLED' : 'REFUND_HANDLED') as any,
                    entityId: payment.id,
                    entityType: 'ProviderPayment',
                    payloadJson: { reason, amount }
                }
            });
        } else {
            // Not released -> Just deduct from general escrow/unreleased area
            await tx.financeAuditLog.create({
                data: {
                    tenantId: payment.tenantId, // Buyer scope or System scope
                    actor: 'PLATFORM_SYSTEM',
                    action: (isChargeback ? 'CHARGEBACK_HANDLED' : 'REFUND_HANDLED') as any,
                    entityId: payment.id,
                    entityType: 'ProviderPayment',
                    payloadJson: { reason, amount, preRelease: true }
                }
            });
        }

        return { success: true };
    });
}
