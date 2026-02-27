import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

function canPerformAction(session: any, actionType: string) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;

    const isPlatformAdmin = role === 'SUPER_ADMIN' || tenantId === 'PLATFORM_ADMIN';
    const isFinance = role === 'PLATFORM_FINANCE_ADMIN';
    const isRisk = role === 'PLATFORM_RISK_ADMIN';

    const monetaryActions = ['PARTIAL_RELEASE', 'FULL_RELEASE', 'REFUND', 'FLAG_CHARGEBACK', 'HOLD_ESCROW'];

    if (monetaryActions.includes(actionType)) {
        return isPlatformAdmin || isFinance; // Defense in depth: only finance/admins can touch money/escrow states
    }

    // Other non-monetary actions like status change
    return isPlatformAdmin || isRisk || isFinance;
}

export async function POST(request: Request, props: { params: Promise<{ ticketId: string }> }) {
    try {
        const session: any = await getSession();
        const body = await request.json();
        const params = await props.params;

        const { ticketId } = params;
        const { actionType, amount, reason, resolutionCode, resolutionSummary } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!canPerformAction(session, actionType)) {
            return NextResponse.json({ error: 'Unauthorized role for this action' }, { status: 403 });
        }

        if (!idempotencyKey) {
            return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        }
        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ error: 'A valid reason must be provided' }, { status: 400 });
        }

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            const dCase = await prisma.disputeCase.findUnique({ where: { ticketId } });
            if (!dCase) throw new Error('Dispute case not found');

            // Transition guards
            if (actionType === 'HOLD_ESCROW' && !['NONE', 'HELD'].includes(dCase.escrowActionState)) {
                throw new Error('Cannot HOLD an already released or refunded escrow.');
            }
            if (actionType === 'FULL_RELEASE' && ['RELEASED', 'REFUNDED'].includes(dCase.escrowActionState)) {
                throw new Error('Already fully processed. Cannot FULL_RELEASE.');
            }
            if (actionType === 'PARTIAL_RELEASE' && (amount === undefined || amount <= 0)) {
                throw new Error('Partial release requires a valid amount > 0.');
            }

            return await prisma.$transaction(async (tx) => {
                let nextState = dCase.escrowActionState;
                let nextStatus = dCase.status;
                let nextResolutionCode = dCase.resolutionCode;
                let resolvedDate: Date | null = dCase.resolvedAt;

                if (actionType === 'HOLD_ESCROW') nextState = 'HELD';
                else if (actionType === 'FULL_RELEASE') nextState = 'RELEASED';
                else if (actionType === 'PARTIAL_RELEASE') nextState = 'PARTIALLY_RELEASED';
                else if (actionType === 'REFUND') nextState = 'REFUNDED';

                if (['FULL_RELEASE', 'REFUND', 'PARTIAL_RELEASE'].includes(actionType)) {
                    nextStatus = 'RESOLVED';
                    resolvedDate = new Date();
                    if (resolutionCode) nextResolutionCode = resolutionCode;
                }

                // Log Action
                const actionLog = await tx.disputeAction.create({
                    data: {
                        disputeCaseId: dCase.id,
                        actionType,
                        actorUserId: session.id || 'SYSTEM',
                        actorRole: session.role || 'UNKNOWN',
                        amount: amount ? amount : null,
                        reason,
                        payloadJson: body,
                        idempotencyKey
                    }
                });

                // Update Case
                await tx.disputeCase.update({
                    where: { id: dCase.id },
                    data: {
                        escrowActionState: nextState,
                        status: nextStatus,
                        resolutionCode: nextResolutionCode,
                        resolutionSummary: resolutionSummary || dCase.resolutionSummary,
                        resolvedAt: resolvedDate,
                        updatedAt: new Date()
                    }
                });

                // Platform Finance Audit
                await tx.financeAuditLog.create({
                    data: {
                        tenantId: 'PLATFORM_ADMIN',
                        action: `DISPUTE_ACTION_${actionType}`,
                        actor: session.id || 'SYSTEM',
                        entityId: dCase.id,
                        entityType: 'DisputeCase',
                        payloadJson: { ticketId, reason, amount, resolutionCode }
                    }
                });

                // Note: actual ledger/payment service posts would be hooked up here
                // e.g., await releaseSellerEarnings(orderId), await refundCharge(...)

                return { actionId: actionLog.id, nextState, nextStatus };
            });
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Dispute Action error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
