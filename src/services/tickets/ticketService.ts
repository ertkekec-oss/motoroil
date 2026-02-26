import { PrismaClient, TicketPriority, TicketRelatedEntityType, TicketType, TicketStatus, TicketSenderRole, TicketAuditAction } from '@prisma/client';
import { redactPII } from './piiRedaction';
import { calculateSlaDueAt } from './slaEngine';

const prisma = new PrismaClient();

export async function getTickets(tenantId: string, isPlatformAdmin: boolean) {
    if (isPlatformAdmin) {
        return prisma.ticket.findMany({ include: { messages: true, auditLogs: true } });
    }
    return prisma.ticket.findMany({
        where: {
            OR: [
                { tenantId },
                { counterpartyTenantId: tenantId }
            ]
        },
        include: { messages: true, auditLogs: true }
    });
}

export async function getTicketDetails(ticketId: string, tenantId: string, isPlatformAdmin: boolean) {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { messages: true, auditLogs: true }
    });
    if (!ticket) throw new Error('Not Found');

    if (!isPlatformAdmin && ticket.tenantId !== tenantId && ticket.counterpartyTenantId !== tenantId) {
        throw new Error('UNAUTHORIZED');
    }
    return ticket;
}

export async function createTicket(
    tenantId: string,
    counterpartyTenantId: string | null,
    type: TicketType,
    relatedEntityType: TicketRelatedEntityType | null,
    relatedEntityId: string | null,
    priority: TicketPriority,
    initialMessage: string,
    userId: string
) {
    const idempotencyKey = `ticket_create_${tenantId}_${type}_${relatedEntityId || 'global'}`;
    const slaDueAt = calculateSlaDueAt(priority, new Date());

    if (relatedEntityId) {
        const existing = await prisma.ticket.findFirst({
            where: { tenantId, type, relatedEntityId, status: 'OPEN' }
        });
        if (existing) throw new Error('ALREADY_SUCCEEDED');
    }

    const redacted = redactPII(initialMessage);

    const ticket = await prisma.ticket.create({
        data: {
            tenantId,
            counterpartyTenantId,
            type,
            relatedEntityType,
            relatedEntityId,
            priority,
            slaDueAt,
            createdByUserId: userId,
            messages: {
                create: {
                    senderTenantId: tenantId,
                    senderRole: 'BUYER',
                    message: initialMessage,
                    redactedMessage: redacted
                }
            },
            auditLogs: {
                create: {
                    action: 'CREATED',
                    actorTenantId: tenantId,
                    payloadJson: { priority, slaDueAt }
                }
            }
        },
        include: { messages: true, auditLogs: true }
    });

    return ticket;
}

export async function addTicketMessage(ticketId: string, senderTenantId: string, senderRole: TicketSenderRole, message: string, isPlatformAdmin: boolean) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('TICKET_NOT_FOUND');

    if (!isPlatformAdmin && ticket.tenantId !== senderTenantId && ticket.counterpartyTenantId !== senderTenantId) {
        throw new Error('UNAUTHORIZED');
    }

    const redacted = redactPII(message);

    let newStatus = ticket.status;
    if (ticket.status === 'RESOLVED') {
        newStatus = 'IN_PROGRESS';
        await prisma.ticketAuditLog.create({
            data: {
                ticketId,
                action: 'STATUS_CHANGED',
                actorTenantId: senderTenantId,
                payloadJson: { old: ticket.status, new: 'IN_PROGRESS' }
            }
        });
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: 'IN_PROGRESS' }
        });
    }

    return prisma.ticketMessage.create({
        data: {
            ticketId,
            senderTenantId,
            senderRole,
            message,
            redactedMessage: redacted
        }
    });
}

export async function changeTicketStatus(ticketId: string, actorTenantId: string, status: TicketStatus, isPlatformAdmin: boolean) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Not Found');

    if (!isPlatformAdmin && ticket.tenantId !== actorTenantId && ticket.counterpartyTenantId !== actorTenantId) {
        throw new Error('UNAUTHORIZED');
    }

    const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : null }
    });

    await prisma.ticketAuditLog.create({
        data: {
            ticketId,
            action: 'STATUS_CHANGED',
            actorTenantId,
            payloadJson: { old: ticket.status, new: status }
        }
    });

    return updated;
}

export async function runTicketSlaMonitor() {
    const targetDate = new Date();
    const breached = await prisma.ticket.findMany({
        where: {
            status: { notIn: ['RESOLVED', 'SLA_BREACH'] },
            slaDueAt: { lt: targetDate }
        }
    });

    for (const ticket of breached) {
        await prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: 'SLA_BREACH' }
        });
        await prisma.ticketAuditLog.create({
            data: {
                ticketId: ticket.id,
                action: 'SLA_UPDATED',
                actorTenantId: 'SYSTEM',
                payloadJson: { breachedAt: new Date(), slaDueAt: ticket.slaDueAt }
            }
        });
    }
}
