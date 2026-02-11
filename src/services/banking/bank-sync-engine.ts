import prisma from '@/lib/prisma';
import { EventBus } from '../fintech/event-bus';
import { TransactionNormalizer } from './transaction-normalizer';

export interface RawBankTransaction {
    id: string;
    amount: number;
    currency: string;
    description: string;
    date: string;
    reference?: string;
}

export class BankSyncEngine {
    /**
     * Synchronizes transactions for all active connections.
     * Can be triggered via Webhook or Cron.
     */
    static async syncAll(companyId: string) {
        const connections = await (prisma as any).bankConnection.findMany({
            where: { companyId, status: 'ACTIVE' }
        });

        const results = [];
        for (const conn of connections) {
            results.push(await this.syncConnection(conn));
        }
        return results;
    }

    /**
     * Sycs a single bank connection
     */
    static async syncConnection(connection: any) {
        // 0. Ensure Single Source of Truth (Kasa entry)
        await this.ensureKasaAccount(connection);

        // 1. Fetch from Partner/Mock API (Production would use Aggregator SDK)
        const rawTransactions = await this.fetchFromPartner(connection);

        // 2. Normalize and Save (Idempotent)
        const savedCount = await this.processTransactions(connection, rawTransactions);

        // 3. Update sync timestamp
        await (prisma as any).bankConnection.update({
            where: { id: connection.id },
            data: { lastSyncAt: new Date() }
        });

        return { connection: connection.bankName, imported: savedCount };
    }

    /**
     * Creates or updates a Kasa record in the accounting system for this bank connection.
     * This ensures the bank appears in the regular "Banka & Kasa" page.
     */
    private static async ensureKasaAccount(connection: any) {
        const companyId = connection.companyId;

        // Check if Kasa already exists for this connection
        const existingKasa = await (prisma as any).kasa.findUnique({
            where: { bankConnectionId: connection.id }
        });

        if (!existingKasa) {
            console.log(`[BankSync] Creating SSOT Kasa for bank: ${connection.bankName}`);
            await (prisma as any).kasa.create({
                data: {
                    companyId,
                    name: `${connection.bankName} (${connection.iban.slice(-4)})`,
                    type: 'bank',
                    bankConnectionId: connection.id,
                    currency: connection.currency || 'TRY',
                    branch: 'Merkez', // Default for now
                    isActive: true,
                    balance: 0 // Will be updated from transactions or balance sync
                }
            });
        }
    }

    private static async processTransactions(connection: any, raw: RawBankTransaction[]) {
        let imported = 0;

        for (const tx of raw) {
            try {
                // Check idempotency
                const existing = await (prisma as any).bankTransaction.findUnique({
                    where: {
                        bankConnectionId_transactionId: {
                            bankConnectionId: connection.id,
                            transactionId: tx.id
                        }
                    }
                });

                if (existing) continue;

                // 3. Normalized Tagging
                const tags = TransactionNormalizer.parse(tx.description);

                // 4. Record Transaction (Immutable)
                const newTx = await (prisma as any).bankTransaction.create({
                    data: {
                        companyId: connection.companyId,
                        bankConnectionId: connection.id,
                        transactionId: tx.id,
                        amount: tx.amount,
                        currency: tx.currency,
                        description: tx.description,
                        transactionDate: new Date(tx.date),
                        direction: tx.amount > 0 ? 'IN' : 'OUT',
                        rawPayload: tx as any
                    }
                });

                // 5. Emit Domain Event for Reconciliation
                await EventBus.emit({
                    companyId: connection.companyId,
                    eventType: 'BANK_TRANSACTION_IMPORTED',
                    aggregateType: 'JOURNAL', // Triggers accounting logic
                    aggregateId: newTx.id,
                    payload: { ...newTx, ...tags }
                });

                imported++;
            } catch (err) {
                console.error(`Error processing bank transaction ${tx.id}:`, err);
            }
        }

        return imported;
    }

    private static async fetchFromPartner(connection: any): Promise<RawBankTransaction[]> {
        // MOCK PARTNER DATA (PSD2 Simulation)
        return [
            {
                id: `TX_${Date.now()}_1`,
                amount: 1540.50,
                currency: 'TRY',
                description: 'TRENDYOL HAKEDIS 2026/FEB/12',
                date: new Date().toISOString()
            },
            {
                id: `TX_${Date.now()}_2`,
                amount: -2500.00,
                currency: 'TRY',
                description: 'KIRA ODEMESI - SUBAT 2026',
                date: new Date().toISOString()
            },
            {
                id: `TX_${Date.now()}_3`,
                amount: 850.00,
                currency: 'TRY',
                description: 'EFT: ALI VELI - SIPARIS#4455',
                date: new Date().toISOString()
            }
        ];
    }
}
