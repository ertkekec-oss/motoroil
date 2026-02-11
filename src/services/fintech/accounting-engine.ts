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
                // Borç: 120.03 (Marketplace), Alacak: 600.01 (Sales), Alacak: 391.01 (VAT)
                const saleTotal = Number(payload.saleAmount || payload.totalAmount);
                const isMarketplace = !!payload.marketplace;
                const recAccount = isMarketplace ? '120.03' : '120.01';

                // Dynamic VAT Support (from items)
                const vatRate = Number(payload.taxRate || 20);
                const netSale = saleTotal / (1 + vatRate / 100);
                const vatAmount = saleTotal - netSale;

                lines.push({ accountCode: recAccount, debit: saleTotal, credit: 0 });
                lines.push({ accountCode: '600.01', debit: 0, credit: netSale });
                lines.push({ accountCode: '391.01', debit: 0, credit: vatAmount });
                break;

            case 'TRENDYOL_TRANSACTION_RECORDED':
            case 'HEPSIBURADA_TRANSACTION_RECORDED':
            case 'MARKETPLACE_TRANSACTION_RECORDED': {
                const { type, amount, transactionId, marketplace } = payload;
                const absAmount = Math.abs(Number(amount));
                const recAccount = '120.03';

                if (type === 'SALE' || type === 'SALE_PAYOUT') {
                    // This is usually redundant if SALE_COMPLETED already fired, 
                    // but in settlement reports it confirms the payout.
                    // We don't post 600 again here, but we move from 120.03 to 102 (later in reconciliation)
                    // Or if it's a direct settlement satırı that wasn't synced as order:
                    // lines.push({ accountCode: recAccount, debit: absAmount, credit: 0 });
                    // lines.push({ accountCode: '600.01', ... });
                } else if (type === 'COMMISSION' || type === 'SERVICE_FEE') {
                    // Borç: 760 (Pazarlama), Borç: 191 (İnd. KDV), Alacak: 120.03 (Alacak Azalışı)
                    const netComm = absAmount / 1.20;
                    const vatComm = absAmount - netComm;
                    lines.push({ accountCode: '760.01', debit: netComm, credit: 0 });
                    lines.push({ accountCode: '191.01', debit: vatComm, credit: 0 });
                    lines.push({ accountCode: recAccount, debit: 0, credit: absAmount, externalReference: transactionId });
                } else if (type === 'CARGO' || type === 'SHIPPING') {
                    // Borç: 760.02 (Kargo Gideri), Borç: 191, Alacak: 120.03
                    const netCargo = absAmount / 1.20;
                    const vatCargo = absAmount - netCargo;
                    lines.push({ accountCode: '760.02', debit: netCargo, credit: 0 });
                    lines.push({ accountCode: '191.01', debit: vatCargo, credit: 0 });
                    lines.push({ accountCode: recAccount, debit: 0, credit: absAmount, externalReference: transactionId });
                } else if (type === 'REFUND') {
                    // Ters Kayıt: Borç: 610 (Satış İadeleri), Borç: 191 (İnd. KDV - eskiden 391 idi ama iadede 191 çalışır), Alacak: 120.03
                    const netRefund = absAmount / 1.20;
                    const vatRefund = absAmount - netRefund;
                    lines.push({ accountCode: '610.01', debit: netRefund, credit: 0 });
                    lines.push({ accountCode: '191.01', debit: vatRefund, credit: 0 });
                    lines.push({ accountCode: recAccount, debit: 0, credit: absAmount, externalReference: transactionId });
                }
                break;
            }

            case 'COMMISSION_BOOKED':
                // Generic manual commission
                const gross = Math.abs(Number(payload.amount));
                const net = gross / 1.20;
                const vat = gross - net;
                lines.push({ accountCode: '760.01', debit: net, credit: 0 });
                lines.push({ accountCode: '191.01', debit: vat, credit: 0 });
                lines.push({ accountCode: '120.03', debit: 0, credit: gross, externalReference: payload.transactionId });
                break;

            case 'BANK_MATCH_CONFIRMED':
                // Borç: 102 Bankalar, Alacak: 120.03 (Veya ilgili hesap)
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
