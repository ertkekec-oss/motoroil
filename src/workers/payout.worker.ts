import { Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/queue/redis';
import { prisma } from '../lib/prisma';
import { getPayoutProvider } from '../services/payments/payouts';
import { B2BJournalSourceType } from '@prisma/client';
import { createSettlementJournalEntry } from '../services/payments/accounting';
import { finalizeEscrowRelease } from '../services/payments/payoutLogic';

export const payoutExecuteWorker = new Worker('payouts_execute', async (job: Job) => {
    const { instructionId } = job.data;

    const instruction = await prisma.settlementInstruction.findUnique({ where: { id: instructionId } });
    if (!instruction || instruction.status !== 'PENDING') return;

    // Fetch the payee to get IBAN
    const payee = await prisma.b2BPayeeProfile.findFirst({
        where: { tenantId: instruction.tenantId, payeeType: instruction.payeeType }
    });

    const provider = getPayoutProvider(instruction.providerKey);
    const result = await provider.initiateTransfer({
        amount: Number(instruction.amount),
        currency: instruction.currency,
        iban: payee?.ibanMasked || "UNKNOWN_IBAN", // Ideally decrypt or pass masked if manual
        reference: `Payout-${instruction.idempotencyKey}`,
        idempotencyKey: instruction.idempotencyKey
    });

    await prisma.settlementInstruction.update({
        where: { id: instruction.id },
        data: {
            status: result.status === 'SETTLED' ? 'SETTLED' : 'EXECUTING',
            providerRef: result.providerRef
        }
    });

    // Update Escrow state to SETTLEMENT_EXECUTING or SETTLED based on Payout Result
    if (result.status === 'SETTLED') {
        await finalizeEscrowRelease(instruction.escrowCaseId, instruction.id);
    } else if (result.status === 'EXECUTING') {
        await prisma.escrowCase.update({
            where: { id: instruction.escrowCaseId },
            data: { status: 'SETTLEMENT_EXECUTING' }
        });
    }
}, { connection: redisConnection as any });
