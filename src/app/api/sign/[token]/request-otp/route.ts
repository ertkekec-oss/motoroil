import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { appendAuditEvent } from '@/services/contracts/audit';
import { enqueueSendSmsOtp } from '@/services/contracts/jobs';
import { ContractActorType, ContractAuditAction } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { token: string } }) {
    try {
        const rawToken = params.token;
        const publicTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Fetch session regardless of tenant since it's a public publicTokenHash unique search
        const session = await prisma.signingSession.findUnique({
            where: { publicTokenHash },
            include: { recipient: true }
        });

        if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
        if (new Date() > session.expiresAt) return NextResponse.json({ error: "Expired" }, { status: 403 });

        // Rate limiting check
        const state = (session.otpState as any) || {};
        const now = Date.now();
        if (state.lastSentAt && (now - state.lastSentAt) < 30000) {
            return NextResponse.json({ error: "Please wait 30 seconds before requesting again" }, { status: 429 });
        }

        if (session.attemptCount >= 5) {
            return NextResponse.json({ error: "Maximum OTP attempt limit reached. Contact support." }, { status: 429 });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.signingSession.update({
            where: { id: session.id },
            data: {
                attemptCount: { increment: 1 },
                otpState: {
                    ...state,
                    code: otpCode,
                    lastSentAt: now
                }
            }
        });

        await appendAuditEvent({
            tenantId: session.tenantId,
            envelopeId: session.recipient.envelopeId,
            recipientId: session.recipientId,
            actorType: ContractActorType.RECIPIENT,
            action: ContractAuditAction.OTP_REQUESTED
        });

        // Enqueue integration worker
        const attemptCounter = ((state.attemptCounter as number) || 0) + 1;
        await enqueueSendSmsOtp(session.id, attemptCounter);

        return NextResponse.json({ success: true, message: "OTP Queued", status: "queued" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
