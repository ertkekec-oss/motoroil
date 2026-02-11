import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PaymentMatchingEngine } from '@/services/fintech/payment-matching-engine';

/**
 * Replays a specific bank transaction through the matching engine.
 * Critical for debugging edge cases and re-processing transactions after rule updates.
 */
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId } = await req.json();

        const tx = await (prisma as any).bankTransaction.findUnique({
            where: { id: transactionId }
        });

        if (!tx || tx.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Trigger Replay
        const result = await prisma.$transaction(async (prismaTx) => {
            // Re-emit logical event
            const event = {
                companyId: tx.companyId,
                aggregateId: tx.id,
                eventType: 'BANK_TRANSACTION_REPLAYED',
                payload: {
                    ...tx.rawPayload as any,
                    description: tx.description,
                    amount: Number(tx.amount),
                    direction: tx.direction,
                    bankTransactionId: tx.id
                }
            };

            return await PaymentMatchingEngine.processBankTransaction(prismaTx, event);
        });

        return NextResponse.json({ success: true, match: result });

    } catch (error: any) {
        console.error('Replay Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
