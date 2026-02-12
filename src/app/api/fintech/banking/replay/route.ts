import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import prisma from '@/lib/prisma';
import { PaymentMatchingEngine } from '@/services/fintech/payment-matching-engine';

/**
 * Replays a specific bank transaction through the matching engine.
 * Critical for debugging edge cases and re-processing transactions after rule updates.
 */
export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        if (!ctx.companyId && ctx.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. ADMIN AUTHORIZATION
        const isAdmin = ctx.role === 'SUPER_ADMIN' || ctx.role?.toLowerCase().includes('admin');
        if (!isAdmin) {
            return NextResponse.json({ error: 'Sadece yöneticiler işlemleri yeniden işletebilir.' }, { status: 403 });
        }

        const { transactionId } = await req.json();

        const tx = await (prisma as any).bankTransaction.findUnique({
            where: { id: transactionId }
        });

        if (!tx || (ctx.tenantId !== 'PLATFORM_ADMIN' && tx.companyId !== ctx.companyId)) {
            return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 });
        }

        // 2. MODE ENGINE
        const isLive = process.env.FINTECH_LIVE_MODE === 'true';
        console.log(`[FINTECH] Replaying transaction ${tx.id} (Mode: ${isLive ? 'LIVE' : 'DRY_RUN'})`);

        // Trigger Replay
        const result = await prisma.$transaction(async (prismaTx) => {
            // Re-emit logical event
            const event = {
                companyId: tx.companyId,
                aggregateId: tx.id,
                eventType: 'BANK_TRANSACTION_REPLAYED',
                payload: {
                    ...(tx.rawPayload as any),
                    description: tx.description,
                    amount: Number(tx.amount),
                    direction: tx.direction,
                    bankTransactionId: tx.id,
                    mode: isLive ? 'LIVE' : 'DRY_RUN'
                }
            };

            return await PaymentMatchingEngine.processBankTransaction(prismaTx, event);
        });

        return NextResponse.json({
            success: true,
            match: result,
            mode: isLive ? 'LIVE' : 'DRY_RUN'
        });

    } catch (error: any) {
        console.error('Replay Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
