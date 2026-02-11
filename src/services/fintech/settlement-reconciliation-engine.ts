import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { EventBus } from './event-bus';
import { AccountingEngine } from './accounting-engine';

export class SettlementReconciliationEngine {
    /**
     * Trendyol Settlement Transaction -> Ledger -> Accounting Entry
     */
    static async processSettledTransaction(companyId: string, marketplace: string, transaction: any) {
        return await prisma.$transaction(async (tx) => {
            // 1. Idempotency Check
            const existing = await tx.marketplaceTransactionLedger.findUnique({
                where: { externalReference: transaction.transactionId }
            });
            if (existing) return existing;

            // 2. Create Ledger Entry (The Pre-Accounting Step)
            const ledger = await tx.marketplaceTransactionLedger.create({
                data: {
                    companyId,
                    marketplace,
                    externalReference: transaction.transactionId,
                    orderId: transaction.orderId,
                    orderNumber: transaction.orderNumber,
                    transactionType: transaction.type, // SALE, COMMISSION, etc.
                    amount: new Decimal(transaction.amount),
                    transactionDate: new Date(transaction.transactionDate),
                    processingStatus: 'PENDING'
                }
            });

            // 3. Trigger Immutable Domain Event
            const event = await EventBus.emit({
                companyId,
                eventType: `${marketplace.toUpperCase()}_TRANSACTION_RECORDED`,
                aggregateType: 'SETTLEMENT',
                aggregateId: ledger.id,
                payload: transaction
            });

            // 4. Post to Immutable Ledger (Accounting Engine)
            const entry = await AccountingEngine.postToLedger(tx, {
                id: event.id,
                companyId,
                payload: { ...transaction, amount: ledger.amount },
                eventType: event.eventType
            });

            // 5. Update Processing Status
            if (entry) {
                await tx.marketplaceTransactionLedger.update({
                    where: { id: ledger.id },
                    data: {
                        processingStatus: 'MATCHED',
                        journalEntryId: entry.id
                    }
                });
            }

            return ledger;
        });
    }

    /**
     * Bank Statement Reconciliation (Match 102 with 120.03)
     */
    static async reconcileBankStatement(statementId: string) {
        return await prisma.$transaction(async (tx) => {
            const statement = await tx.bankStatement.findUnique({
                where: { id: statementId }
            });

            if (!statement || statement.isMatched) return;

            // 1. Find Open Receivables for Trendyol (120.03)
            const openReceivables = await tx.journalLine.findMany({
                where: {
                    accountCode: '120.03',
                    companyId: statement.companyId,
                    isOpen: true
                },
                orderBy: { journalEntry: { date: 'asc' } },
                include: { journalEntry: true }
            });

            const totalOpen = openReceivables.reduce((acc: number, line: any) => acc + Number(line.credit), 0);
            const payoutAmount = Number(statement.credit); // Banka ekstresindeki alacak (Bize gelen para)
            const difference = payoutAmount - totalOpen;

            let reconStatus = 'MISMATCH';

            // 2. MATCHING LOGIC
            if (Math.abs(difference) === 0) {
                // FULL MATCH
                reconStatus = 'FULL';
                await this.closeReceivables(tx, openReceivables, statement.id);
            } else if (Math.abs(difference) <= 1.00) {
                // TOLERANCE MATCH (±1 TL)
                reconStatus = 'TOLERATED';
                await this.closeReceivables(tx, openReceivables, statement.id);
                await this.postToleranceEntry(tx, statement, difference);
            } else {
                // MISMATCH -> Suspense
                reconStatus = 'MISMATCH';
                await this.postSuspenseEntry(tx, statement, difference);
            }

            // 3. Update Bank Statement
            await tx.bankStatement.update({
                where: { id: statement.id },
                data: { isMatched: true }
            });

            return { status: reconStatus, difference };
        });
    }

    private static async closeReceivables(tx: any, lines: any[], statementId: string) {
        for (const line of lines) {
            await tx.journalLine.update({
                where: { id: line.id },
                data: { isOpen: false }
            });

            // Update Ledger relation
            await tx.marketplaceTransactionLedger.updateMany({
                where: { journalEntryId: line.journalEntryId },
                data: {
                    processingStatus: 'RECONCILED',
                    reconciliationStatus: 'FULL',
                    matchedBankStatementId: statementId
                }
            });
        }
    }

    private static async postToleranceEntry(tx: any, statement: any, diff: number) {
        const isExtra = diff > 0;
        const accountCode = isExtra ? '679.01' : '689.01'; // Yuvarlama Geliri/Gideri

        await tx.journalEntry.create({
            data: {
                companyId: statement.companyId,
                description: `Tolerance Adjustment (±1 TL) - Ref: ${statement.referenceNo}`,
                lines: {
                    create: [
                        {
                            accountCode: '120.03',
                            debit: isExtra ? new Decimal(diff) : 0,
                            credit: isExtra ? 0 : new Decimal(Math.abs(diff)),
                            companyId: statement.companyId,
                            isOpen: false
                        },
                        {
                            accountCode,
                            debit: isExtra ? 0 : new Decimal(Math.abs(diff)),
                            credit: isExtra ? new Decimal(diff) : 0,
                            companyId: statement.companyId
                        }
                    ]
                }
            }
        });
    }

    private static async postSuspenseEntry(tx: any, statement: any, diff: number) {
        // 397.01 - Pazaryeri Mutabakat Bekleyen Farklar
        await tx.journalEntry.create({
            data: {
                companyId: statement.companyId,
                description: `Suspense Mismatch Entry - Ref: ${statement.referenceNo}`,
                lines: {
                    create: [
                        {
                            accountCode: '102.01',
                            debit: new Decimal(statement.credit),
                            credit: 0,
                            companyId: statement.companyId
                        },
                        {
                            accountCode: '397.01',
                            debit: 0,
                            credit: new Decimal(statement.credit),
                            companyId: statement.companyId
                        }
                    ]
                }
            }
        });
    }
}
