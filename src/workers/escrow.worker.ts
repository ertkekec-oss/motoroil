import { Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/queue/redis';
import { prisma } from '../lib/prisma';
import { getPaymentProvider } from '../services/payments/providers';
import { createSettlementJournalEntry } from '../services/payments/accounting';
import { B2BJournalSourceType, EscrowAction } from '@prisma/client';
import { getAccountReconStatus } from '../services/finance/reconciliation/health';

const releaseEscrowWorker = new Worker('escrow_release', async (job: Job) => {
    const { escrowCaseId } = job.data;

    const escrowCase = await prisma.escrowCase.findUnique({ where: { id: escrowCaseId } });
    if (!escrowCase || escrowCase.status === 'RELEASED' || escrowCase.status === 'DISPUTED') {
        return; // Guard: Cannot release if disputed or already released
    }

    if (escrowCase.status !== 'FUNDS_HELD' && escrowCase.status !== 'RELEASE_REQUESTED') {
        return;
    }

    const { overrideReconLock } = job.data;

    // Reconciliation Dispute/Overdue Lock Guard
    // We assume membership directly implies the dealer's accountId.
    // For MVP we lookup the mapped account manually or skip if not found.
    const agreement = await prisma.networkAgreement.findFirst({
        where: { membershipId: escrowCase.membershipId, supplierTenantId: escrowCase.supplierTenantId }
    });

    if (agreement && agreement.dealerTenantId && !overrideReconLock) {
        const dealerCustomer = await prisma.customer.findFirst({
            where: { companyId: escrowCase.supplierTenantId, tenantId: agreement.dealerTenantId }
        });

        if (dealerCustomer) {
            const reconStatus = await getAccountReconStatus(dealerCustomer.id);
            if (['DISPUTED', 'OVERDUE'].includes(reconStatus.health)) {
                await prisma.escrowEvent.create({
                    data: {
                        tenantId: escrowCase.supplierTenantId,
                        escrowCaseId: escrowCase.id,
                        action: 'RELEASE_REQUESTED' as EscrowAction,
                        systemNotes: `Escrow release blocked due to account Recon Health: ${reconStatus.health}. Admin override required to release.`
                    }
                });
                return; // HARD BLOCK
            }
        }
    }

    // CREATE SETTLEMENT INSTRUCTION
    // Idempotency: try to find existing PENDING or later instruction
    let checkInstruction = await prisma.settlementInstruction.findFirst({
        where: { escrowCaseId: escrowCase.id }
    });

    if (!checkInstruction) {
        checkInstruction = await prisma.settlementInstruction.create({
            data: {
                idempotencyKey: `settle-${escrowCase.id}-v1`,
                tenantId: escrowCase.supplierTenantId,
                escrowCaseId: escrowCase.id,
                payeeType: 'SUPPLIER_BANK',
                amount: escrowCase.amount,
                currency: escrowCase.currency,
                status: 'PENDING',
                providerKey: 'manual_bank', // Default operational payout
                scheduledAt: new Date()
            }
        });

        // Mark as RELEASE_REQUESTED
        await prisma.escrowCase.update({
            where: { id: escrowCase.id },
            data: { status: 'RELEASE_REQUESTED' }
        });

        await prisma.escrowEvent.create({
            data: {
                supplierTenantId: escrowCase.supplierTenantId,
                escrowCaseId: escrowCase.id,
                action: EscrowAction.RELEASE_REQUESTED,
                metaJson: { instructionId: checkInstruction.id }
            }
        });
    }

}, { connection: redisConnection as any });

const refundEscrowWorker = new Worker('escrow_refund', async (job: Job) => {
    const { escrowCaseId, amount } = job.data;

    const escrowCase = await prisma.escrowCase.findUnique({ where: { id: escrowCaseId } });
    if (!escrowCase || escrowCase.status === 'REFUNDED') {
        return;
    }

    // Typically you can refund when DISPUTED or REQUESTED
    const provider = getPaymentProvider(escrowCase.providerKey);
    let refundResult = { status: "FAILED" };

    if (escrowCase.holdMode === 'PROVIDER_NATIVE') {
        // Actually issue refund through provider API
        refundResult = await provider.refundPayment(escrowCase.providerRef || "", amount);
    } else {
        // Operational: provider processes refund vs virtual ledger.
        // Assuming we always try provider refund since operational doesn't hold at provider level: 
        refundResult = await provider.refundPayment(escrowCase.providerRef || "", amount);
    }

    if (refundResult.status === 'REFUNDED') {
        if (escrowCase.holdMode === 'OPERATIONAL') {
            await createSettlementJournalEntry({
                tenantId: escrowCase.supplierTenantId,
                sourceType: B2BJournalSourceType.REFUND,
                sourceId: escrowCase.id,
                amount: amount || Number(escrowCase.amount),
                currency: escrowCase.currency,
                description: `Escrow Refund for Order ${escrowCase.orderId}`,
                debitAccountCode: "336", // Escrow Liability
                creditAccountCode: "102" // AP / Dealer (Returning the cached funds)
            });
        }

        await prisma.escrowCase.update({
            where: { id: escrowCase.id },
            data: { status: 'REFUNDED' }
        });

        await prisma.escrowEvent.create({
            data: {
                supplierTenantId: escrowCase.supplierTenantId,
                escrowCaseId: escrowCase.id,
                action: EscrowAction.REFUNDED,
            }
        });
    }

}, { connection: redisConnection as any });

export { releaseEscrowWorker, refundEscrowWorker };
