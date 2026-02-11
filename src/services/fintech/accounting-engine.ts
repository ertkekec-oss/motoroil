import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class AccountingEngine {
    /**
     * Creates an immutable JournalEntry from a domain event
     */
    static async postToLedger(tx: any, event: { id: string, companyId: string, payload: any, eventType: string }) {
        // 1. Idempotency Check
        const existing = await tx.journalEntry.findUnique({
            where: { sourceEventId: event.id }
        });
        if (existing) return existing;

        // 2. Prepare Ledger Lines based on Event Type
        const lines = this.generateLines(event);
        if (lines.length === 0) return null;

        // 3. Create Journal Entry (Immutable)
        return await tx.journalEntry.create({
            data: {
                companyId: event.companyId,
                sourceEventId: event.id,
                description: `Auto-posted from ${event.eventType}`,
                lines: {
                    create: lines.map((l: any) => ({
                        accountCode: l.accountCode,
                        debit: l.debit,
                        credit: l.credit,
                        externalReference: l.externalReference,
                        companyId: event.companyId
                    }))
                }
            }
        });
    }

    private static generateLines(event: any) {
        const { payload, eventType } = event;
        const lines: any[] = [];

        switch (eventType) {
            case 'PURCHASE_CREATED':
                // Borç: 153 Ticari Mallar, Alacak: 320 Satıcılar
                const total = Number(payload.totalAmount);
                lines.push({ accountCode: '153.01', debit: total, credit: 0 });
                lines.push({ accountCode: '320.01', debit: 0, credit: total });
                break;

            case 'SALE_COMPLETED':
                // Borç: 120 Alıcılar, Alacak: 600 Satışlar
                const saleTotal = Number(payload.totalAmount);
                lines.push({ accountCode: '120.01', debit: saleTotal, credit: 0 });
                lines.push({ accountCode: '600.01', debit: 0, credit: saleTotal });
                break;

            case 'COMMISSION_BOOKED':
                // CTO Special: 760 + 191 (Gross from Net)
                const gross = Math.abs(Number(payload.amount));
                const net = gross / 1.20;
                const vat = gross - net;
                lines.push({ accountCode: '760.01', debit: net, credit: 0 });
                lines.push({ accountCode: '191.01', debit: vat, credit: 0 });
                lines.push({ accountCode: '120.03', debit: 0, credit: gross, externalReference: payload.transactionId });
                break;

            case 'BANK_MATCH_CONFIRMED':
                // Borç: 102 Bankalar, Alacak: 120 Alıcılar (Veya ilgili hesap)
                const matchAmount = Number(payload.amount);
                lines.push({ accountCode: payload.accountCode || '102.01', debit: matchAmount, credit: 0 });
                lines.push({ accountCode: payload.offsetAccountCode || '120.03', debit: 0, credit: matchAmount, externalReference: payload.bankTransactionId });
                break;

            case 'BANK_TRANSACTION_SUSPENSE':
                // Borç: 102 Bankalar, Alacak: 397 Bekleyen İşlemler
                const suspenseAmount = Number(payload.amount);
                lines.push({ accountCode: '102.01', debit: suspenseAmount, credit: 0 });
                lines.push({ accountCode: payload.accountCode || '397.01', debit: 0, credit: suspenseAmount, externalReference: payload.bankTransactionId });
                break;
        }

        return lines;
    }
}
