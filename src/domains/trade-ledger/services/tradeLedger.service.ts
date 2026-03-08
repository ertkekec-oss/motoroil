import prisma from '@/lib/prisma';

export interface TradeLedgerEntryParams {
    tenantId?: string;
    buyerTenantId?: string;
    sellerTenantId?: string;
    canonicalProductId?: string;
    productId?: string;
    opportunityId?: string;
    proposalId?: string;
    contractId?: string;
    escrowId?: string;
    shipmentId?: string;
    disputeId?: string;
    eventType: string;
    eventStatus?: string;
    amount?: number;
    quantity?: number;
    currency?: string;
    metadataJson?: any;
    sourceType?: string;
    sourceRef?: string;
    occurredAt?: Date;
}

export class TradeLedgerService {
    static async recordEvent(params: TradeLedgerEntryParams) {
        try {
            // 🟢 Idempotency Check
            if (params.sourceRef && params.eventType) {
                const existing = await prisma.tradeLedgerEntry.findFirst({
                    where: {
                        eventType: params.eventType,
                        sourceRef: params.sourceRef
                    }
                });
                if (existing) {
                    console.log(`[TradeLedger] Event already recorded for eventType=${params.eventType} and sourceRef=${params.sourceRef}. Skipping to maintain append-only idempotency.`);
                    return existing;
                }
            }

            const entry = await prisma.tradeLedgerEntry.create({
                data: {
                    ...params,
                    occurredAt: params.occurredAt || new Date()
                }
            });
            return entry;
        } catch (e) {
            console.error('[TradeLedger] Failed to record event', e);
            // Fail silently to not break the main transaction flow
            return null;
        }
    }

    static async linkEntities(ledgerEntryId: string, linkedEntityType: string, linkedEntityId: string) {
        return prisma.tradeLedgerLink.create({
            data: {
                ledgerEntryId,
                linkedEntityType,
                linkedEntityId
            }
        });
    }

    static async listLedgerEntries(filters: any = {}) {
        return prisma.tradeLedgerEntry.findMany({
            where: filters,
            orderBy: { occurredAt: 'desc' },
            take: 100
        });
    }

    static async getTradeTimeline(proposalId: string) {
        return prisma.tradeLedgerEntry.findMany({
            where: { proposalId },
            orderBy: { occurredAt: 'asc' }
        });
    }
}
