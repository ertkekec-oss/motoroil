import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PaymentMatchingEngine } from '@/services/fintech/payment-matching-engine';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { matchId, accountCode, learningEnabled } = await req.json();

        const match = await (prisma as any).paymentMatch.findUnique({
            where: { id: matchId },
            include: { bankTransaction: true }
        });

        if (!match || match.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // 1. Trigger Manual Confirmation and Learning
        await prisma.$transaction(async (tx) => {
            // Confirm the match status
            await tx.paymentMatch.update({
                where: { id: matchId },
                data: {
                    status: 'CONFIRMED',
                    matchType: 'MANUAL',
                    confidenceScore: 100
                }
            });

            // 2. SELF-LEARNING: Create a rule from this manual action
            if (learningEnabled) {
                await PaymentMatchingEngine.learnPattern(
                    session.user.companyId,
                    match.bankTransaction.description,
                    'MARKETPLACE', // Or derived from target
                    accountCode
                );
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Manual Match Error:', error);
        if (error.status) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
