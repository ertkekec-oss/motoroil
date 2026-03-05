import { prisma } from "@/lib/prisma";
import { executePayoutQueue } from "@/services/payments/queue";
import { finalizeEscrowRelease } from "@/services/payments/payoutLogic";

export async function processBankInboxTransaction(tenantId: string, txId: string) {
    const inboxTx = await prisma.b2BBankTransactionInbox.findUnique({ where: { id: txId } });
    if (!inboxTx || inboxTx.matched) return { matched: false };

    // Find EXECUTING instruction matching Amount + part of Description/Reference
    const possibleMatches = await prisma.settlementInstruction.findMany({
        where: {
            tenantId,
            status: { in: ["EXECUTING", "PENDING"] },
            amount: inboxTx.amount,
            currency: inboxTx.currency
        }
    });

    for (const inst of possibleMatches) {
        // Primary matcher: Strict Idempotency Key mapping
        const isStrict = inboxTx.description?.includes(inst.idempotencyKey) || inboxTx.description?.includes(inst.id);

        // Fallback matcher: Wait, if the amount matches exactly and time is close... (ambiguous)
        const isAmbiguous = !isStrict && inst.status === "EXECUTING";

        if (isStrict) {
            await prisma.b2BBankTransactionInbox.update({
                where: { id: txId },
                data: { matched: true, settlementInstId: inst.id }
            });
            await finalizeEscrowRelease(inst.escrowCaseId, inst.id);
            return { matched: true, instructionId: inst.id, strict: true };
        } else if (isAmbiguous) {
            // Needs Review! Note: this simply flags the SettlementInstruction
            await prisma.settlementInstruction.update({
                where: { id: inst.id },
                data: { status: "NEEDS_REVIEW" }
            });
            // We do not set inboxTx.matched = true yet. A human matches it.
            return { matched: false, instructionId: inst.id, needsReview: true };
        }
    }

    return { matched: false };
}

