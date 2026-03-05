import { prisma } from "@/lib/prisma";

export async function runSettlementHealthCheck() {
    const report: Record<string, any[]> = {
        capturedNotHeld: [],
        heldNoJournal: [],
        settledNoJournal: [],
        releasedInstructionNotSettled: [],
        stuckExecuting: []
    };

    // 1) CAPTURED but not FUNDS_HELD
    // We check PaymentIntents that are CAPTURED but the related EscrowCase is still REQUIRED
    const capturedIntents = await prisma.paymentIntent.findMany({
        where: { status: 'CAPTURED' },
        select: { id: true, orderId: true }
    });

    for (const intent of capturedIntents) {
        const escrow = await prisma.escrowCase.findFirst({
            where: { orderId: intent.orderId }
        });
        if (escrow && escrow.status === 'REQUIRED') {
            report.capturedNotHeld.push({ intentId: intent.id, escrowId: escrow.id });
        }
    }

    // 2) FUNDS_HELD without journal (OPERATIONAL only)
    const heldEscrows = await prisma.escrowCase.findMany({
        where: { status: 'FUNDS_HELD', holdMode: 'OPERATIONAL' },
        select: { id: true }
    });
    for (const escrow of heldEscrows) {
        const journal = await prisma.b2BJournalEntry.findFirst({
            where: { sourceType: 'ESCROW', sourceId: escrow.id }
        });
        if (!journal) {
            report.heldNoJournal.push({ escrowId: escrow.id });
        }
    }

    // 3) SETTLED without journal (for SettlementInstruction) -> check if B2BJournal exists
    const settledInstructions = await prisma.settlementInstruction.findMany({
        where: { status: 'SETTLED' },
        select: { id: true, escrowCaseId: true }
    });
    for (const inst of settledInstructions) {
        // Did we do the release journal?
        const releaseJournal = await prisma.b2BJournalEntry.findFirst({
            where: { sourceType: 'ESCROW', sourceId: inst.escrowCaseId, lines: { some: { debit: { gt: 0 }, account: { code: "336" } } } }
        });
        if (!releaseJournal) {
            report.settledNoJournal.push({ instructionId: inst.id, escrowCaseId: inst.escrowCaseId });
        }
    }

    // 4) RELEASED but instruction not SETTLED
    const releasedEscrows = await prisma.escrowCase.findMany({
        where: { status: 'RELEASED' },
        select: { id: true }
    });
    for (const escrow of releasedEscrows) {
        const inst = await prisma.settlementInstruction.findFirst({
            where: { escrowCaseId: escrow.id }
        });
        if (inst && inst.status !== 'SETTLED') {
            report.releasedInstructionNotSettled.push({ escrowId: escrow.id, instructionId: inst.id, instructionStatus: inst.status });
        }
    }

    // 5) Stuck EXECUTING check ( > 2 hours )
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const stuckInst = await prisma.settlementInstruction.findMany({
        where: {
            status: 'EXECUTING',
            createdAt: { lt: twoHoursAgo }
        },
        select: { id: true, createdAt: true, idempotencyKey: true }
    });
    report.stuckExecuting = stuckInst;

    return report;
}
