import prisma from '@/lib/prisma';
import { SupportTicketPriority, SupportTicket } from '@prisma/client';

export class SupportSLAService {

    /**
     * 1. Retrieve SLAs (Global fallback Map, overridden by Tenant maps)
     */
    static async getSLAPolicies(tenantId?: string | null) {
        const globalSlas = await prisma.supportSLA.findMany({ where: { tenantId: null } });

        let tenantSlas: any[] = [];
        if (tenantId) {
            tenantSlas = await prisma.supportSLA.findMany({ where: { tenantId } });
        }

        // Core Defaults aligned w/ spec
        const policies = new Map<SupportTicketPriority, { firstResponseMinutes: number, resolutionMinutes: number }>();

        policies.set('LOW', { firstResponseMinutes: 24 * 60, resolutionMinutes: 72 * 60 });
        policies.set('NORMAL', { firstResponseMinutes: 8 * 60, resolutionMinutes: 48 * 60 });
        policies.set('HIGH', { firstResponseMinutes: 2 * 60, resolutionMinutes: 12 * 60 });
        policies.set('CRITICAL', { firstResponseMinutes: 30, resolutionMinutes: 4 * 60 });

        for (const sla of globalSlas) {
            policies.set(sla.priority, { firstResponseMinutes: sla.firstResponseMinutes, resolutionMinutes: sla.resolutionMinutes });
        }

        for (const sla of tenantSlas) {
            policies.set(sla.priority, { firstResponseMinutes: sla.firstResponseMinutes, resolutionMinutes: sla.resolutionMinutes });
        }

        return policies;
    }

    /**
     * 2. Bind SLA Tracking to a newly created ticket
     */
    static async applySLA(ticket: SupportTicket) {
        const policies = await this.getSLAPolicies(ticket.tenantId);
        const policy = policies.get(ticket.priority);

        if (!policy) return null;

        const now = new Date();
        const firstRespDead = new Date(now.getTime() + policy.firstResponseMinutes * 60000);
        const resDead = new Date(now.getTime() + policy.resolutionMinutes * 60000);

        return prisma.supportSLATracking.create({
            data: {
                ticketId: ticket.id,
                priority: ticket.priority,
                firstResponseDeadline: firstRespDead,
                resolutionDeadline: resDead,
                status: 'ACTIVE'
            }
        });
    }

    /**
     * 3. Background Job: Evaluate SLA compliance and auto-escalate
     */
    static async checkSLABreaches() {
        console.log('[SLA Tracking] Checking breaches...');
        const now = new Date();

        const activeTrackings = await prisma.supportSLATracking.findMany({
            where: {
                status: 'ACTIVE',
                OR: [
                    { firstResponseDeadline: { lt: now } },
                    { resolutionDeadline: { lt: now } }
                ]
            },
            include: { ticket: true }
        });

        for (const tracking of activeTrackings) {
            // Security Check: Make sure ticket wasn't resolved meanwhile
            if (tracking.ticket.status === 'RESOLVED' || tracking.ticket.status === 'CLOSED') {
                await prisma.supportSLATracking.update({
                    where: { id: tracking.id },
                    data: { status: 'RESOLVED' }
                });
                continue;
            }

            await prisma.supportSLATracking.update({
                where: { id: tracking.id },
                data: { status: 'BREACHED' }
            });

            console.log(`[SLA Engine] SLA breached on ${tracking.ticketId}. Escalating...`);

            let nextPriority = tracking.ticket.priority;
            if (nextPriority === 'LOW') nextPriority = 'NORMAL';
            else if (nextPriority === 'NORMAL') nextPriority = 'HIGH';
            else if (nextPriority === 'HIGH') nextPriority = 'CRITICAL';

            if (nextPriority !== tracking.ticket.priority) {
                await prisma.supportTicket.update({
                    where: { id: tracking.ticketId },
                    data: { priority: nextPriority }
                });
                // We do not recreate SLA Tracking here inside the worker so it stays "BREACHED"
                // in logs, but the ticket continues to carry its new Priority for agents.
            }
        }

        return activeTrackings.length; // return count of breaches processed
    }

    /**
     * 4. Resolve an SLA Record cleanly
     */
    static async resolveSLA(ticketId: string) {
        await prisma.supportSLATracking.updateMany({
            where: { ticketId, status: 'ACTIVE' },
            data: { status: 'RESOLVED' }
        });
    }
}
