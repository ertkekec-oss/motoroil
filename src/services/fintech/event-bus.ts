import prisma from '@/lib/prisma';
import { PnLEngine } from './pnl-engine';

export type AggregateType = 'ORDER' | 'INVENTORY' | 'JOURNAL' | 'SETTLEMENT' | 'PRODUCT';

export interface DomainEventPayload {
    id?: string;
    companyId: string;
    eventType: string;
    aggregateType: AggregateType;
    aggregateId: string;
    payload: any;
    metadata?: any;
    createdBy?: string;
}

export class EventBus {
    /**
     * Records a domain event and triggers listeners
     */
    static async emit(event: DomainEventPayload) {
        return await prisma.$transaction(async (tx) => {
            // 1. Record the event (The Source of Truth)
            const recordedEvent = await tx.domainEvent.create({
                data: {
                    companyId: event.companyId,
                    eventType: event.eventType,
                    aggregateType: event.aggregateType,
                    aggregateId: event.aggregateId,
                    payload: event.payload,
                    metadata: event.metadata || {},
                    createdBy: event.createdBy
                }
            });

            // 2. Trigger synchronous processing (e.g., Accounting, FIFO, P&L)
            // Incremental P&L Update
            await PnLEngine.updatePnl(tx, recordedEvent);

            // Payment Matching for Bank Transactions
            if (event.eventType === 'BANK_TRANSACTION_IMPORTED') {
                const { PaymentMatchingEngine } = require('./payment-matching-engine');
                await PaymentMatchingEngine.processBankTransaction(tx, recordedEvent);
            }

            return recordedEvent;
        });
    }

    /**
     * Query events for a specific aggregate (Audit Trail)
     */
    static async getHistory(aggregateId: string) {
        return await prisma.domainEvent.findMany({
            where: { aggregateId },
            orderBy: { createdAt: 'asc' }
        });
    }
}
