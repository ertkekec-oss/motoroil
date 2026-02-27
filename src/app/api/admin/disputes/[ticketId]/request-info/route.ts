import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { withIdempotency } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

function isAuthorized(session: any) {
    if (!session) return false;
    const role = session.role?.toUpperCase() || '';
    const tenantId = session.tenantId;
    return role === 'SUPER_ADMIN' ||
        role === 'PLATFORM_ADMIN' ||
        role === 'PLATFORM_RISK_ADMIN' ||
        tenantId === 'PLATFORM_ADMIN';
}

export async function POST(request: Request, props: { params: Promise<{ ticketId: string }> }) {
    try {
        const session: any = await getSession();
        if (!isAuthorized(session)) {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
        }

        const body = await request.json();
        const params = await props.params;
        const { ticketId } = params;
        const { fieldsRequested } = body;
        const idempotencyKey = request.headers.get('x-idempotency-key');

        if (!idempotencyKey) {
            return NextResponse.json({ error: 'x-idempotency-key is required' }, { status: 400 });
        }
        if (!fieldsRequested || !Array.isArray(fieldsRequested) || fieldsRequested.length === 0) {
            return NextResponse.json({ error: 'fieldsRequested array is missing or empty' }, { status: 400 });
        }

        const result = await withIdempotency(idempotencyKey, 'PLATFORM_ADMIN', async () => {
            const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
            if (!ticket) throw new Error('Ticket not found');

            // Generate a structured system message prompting the tenant
            const structuredPrompt = `[BILGI TALEBI] Platform yöneticisi aşağıdaki kanıt veya belgeleri talep etmektedir:\n- ${fieldsRequested.join('\n- ')}`;

            return await prisma.$transaction(async (tx) => {
                // 1. Add Message
                await tx.ticketMessage.create({
                    data: {
                        ticketId,
                        message: structuredPrompt,
                        redactedMessage: structuredPrompt, // Internal predefined template
                        senderRole: 'SYSTEM',
                        senderTenantId: 'PLATFORM_ADMIN'
                    }
                });

                // 2. Update Dispute
                const dispute = await tx.disputeCase.update({
                    where: { ticketId },
                    data: { status: 'NEEDS_INFO', updatedAt: new Date() }
                });

                // 3. Update active status on ticket matching Support G1 model
                await tx.ticket.update({
                    where: { id: ticketId },
                    data: { status: 'IN_PROGRESS' }
                });

                return { disputeCaseId: dispute.id, status: dispute.status };
            });
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Request Info error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
