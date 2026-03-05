import { prisma } from "@/lib/prisma";
import { B2BJournalSourceType } from '@prisma/client';
import { createSettlementJournalEntry } from './accounting';

export async function finalizeEscrowRelease(escrowCaseId: string, settlementInstId: string) {
    const escrowCase = await prisma.escrowCase.findUnique({ where: { id: escrowCaseId } });
    if (!escrowCase || escrowCase.status === 'RELEASED') return;

    // Do actual accounting (336 DR -> 102 CR)
    if (escrowCase.holdMode === 'OPERATIONAL') {
        await createSettlementJournalEntry({
            tenantId: escrowCase.supplierTenantId,
            sourceType: B2BJournalSourceType.ESCROW,
            sourceId: escrowCase.id,
            amount: Number(escrowCase.amount),
            currency: escrowCase.currency,
            description: `Escrow Realized Payout for Order ${escrowCase.orderId}`,
            debitAccountCode: "336", // Reduce Escrow Liability
            creditAccountCode: "102" // Reduce Bank (Cash Out)
        });
    }

    await prisma.settlementInstruction.update({
        where: { id: settlementInstId },
        data: { status: 'SETTLED', settledAt: new Date() }
    });

    await prisma.escrowCase.update({
        where: { id: escrowCase.id },
        data: { status: 'RELEASED', releasedAt: new Date() }
    });
}
