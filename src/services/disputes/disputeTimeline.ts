import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UnifiedTimelineEvent {
    source: 'SHIPMENT' | 'ESCROW' | 'DISPUTE';
    type: string; // Dynamic based on source
    summary: string;
    metadata?: any;
    actor?: { type: string, tenantId?: string, userId?: string };
    occurredAt: Date;
}

export class DisputeTimelineService {
    /**
     * Builds an aggregated timeline covering Escrow, Shipment, and Dispute history to help Admin arbitration.
     */
    static async buildUnifiedTimeline(disputeId: string): Promise<UnifiedTimelineEvent[]> {
        const dispute = await prisma.networkDispute.findUnique({
            where: { id: disputeId },
            include: {
                events: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!dispute) {
            return [];
        }

        const unifiedHistory: UnifiedTimelineEvent[] = [];

        // 1. Gather Dispute Events
        for (const ev of dispute.events) {
            unifiedHistory.push({
                source: 'DISPUTE',
                type: ev.eventType,
                summary: ev.summary,
                actor: { type: ev.actorType, tenantId: ev.actorTenantId || undefined, userId: ev.actorUserId || undefined },
                metadata: ev.metadata,
                occurredAt: ev.createdAt
            });
        }

        // 2. Gather Escrow Events
        if (dispute.escrowHoldId) {
            const escrowEvents = await prisma.networkEscrowLifecycleEvent.findMany({
                where: { escrowHoldId: dispute.escrowHoldId },
                orderBy: { createdAt: 'asc' }
            });
            for (const ev of escrowEvents) {
                // Skip duplicate logging from Dispute Engine
                if (ev.source === 'DISPUTE_ENGINE') continue;

                unifiedHistory.push({
                    source: 'ESCROW',
                    type: ev.eventType,
                    summary: `Escrow event: ${ev.newState}`,
                    metadata: { previousState: ev.previousState, source: ev.source },
                    occurredAt: ev.createdAt
                });
            }
        }

        // 3. Gather Shipment Tracking Events
        if (dispute.shipmentId) {
            const trackingEvents = await prisma.networkShipmentTrackingEvent.findMany({
                where: { shipmentId: dispute.shipmentId },
                orderBy: { eventTime: 'asc' }
            });
            for (const ev of trackingEvents) {
                unifiedHistory.push({
                    source: 'SHIPMENT',
                    type: ev.normalizedStatus,
                    summary: ev.description || `Tracking update: ${ev.normalizedStatus}`,
                    metadata: { carrierCode: ev.carrierCode, locationText: ev.locationText, ...ev.rawPayload as any },
                    occurredAt: ev.eventTime
                });
            }
        }

        // Sort the blended array chronologically
        return unifiedHistory.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    }
}

