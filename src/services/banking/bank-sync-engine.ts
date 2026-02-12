import prisma from '@/lib/prisma';
import { EventBus } from '../fintech/event-bus';
import { TransactionNormalizer } from './transaction-normalizer';
import { generateTransactionFingerprint } from './utils';
import { BankConnectionService } from './bank-connection-service';

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
     * Respects process.env.BANK_LIVE_MODE: DRY_RUN | LIVE_PULL | LIVE_ALL
     */
    static async syncAll(companyId: string) {
        const startTime = Date.now();
        const mode = process.env.BANK_LIVE_MODE || 'DRY_RUN';

        const connections = await (prisma as any).bankConnection.findMany({
            where: { companyId, status: 'ACTIVE' }
        });

        console.log(`[BankSync] Starting Batch Sync (Mode: ${mode}) for ${connections.length} connections.`);

        const results = [];
        for (const conn of connections) {
            try {
                const result = await this.syncConnection(conn, mode);
                results.push(result);
            } catch (err: any) {
                console.error(`[BankSync] Failed to sync ${conn.bankName}:`, err);
                results.push({ connection: conn.bankName, success: false, error: err.message });
            }
        }

        const duration = Date.now() - startTime;
        console.log(`[BankSync] Batch Sync Completed in ${duration}ms.`);

        return { results, duration, mode };
    }

    static async syncConnection(connection: any, mode: string = 'DRY_RUN') {
        const startTime = Date.now();
        console.log(`[BankSync] Starting sync for: ${connection.bankName} (${connection.iban}) in ${mode} mode.`);

        try {
            const kasa = await this.ensureKasaAccount(connection);
            const rawTransactions = await this.fetchFromPartner(connection);
            const savedCount = await this.processTransactions(connection, rawTransactions, mode);

            if (mode !== 'DRY_RUN') {
                await BankConnectionService.updateStatus(connection.id, 'ACTIVE', {
                    actorId: 'system',
                    reasonCode: 'SUCCESSFUL_SYNC'
                });

                await (prisma as any).bankConnection.update({
                    where: { id: connection.id },
                    data: { lastSyncAt: new Date() }
                });
            }

            const duration = Date.now() - startTime;
            return { connection: connection.bankName, imported: savedCount, success: true, duration };
        } catch (err: any) {
            if (mode !== 'DRY_RUN') {
                const errorCode = BankConnectionService.classifyError(err);
                const newStatus = errorCode === 'AUTH_FAILED' ? 'EXPIRED' : 'ERROR';

                await BankConnectionService.updateStatus(connection.id, newStatus, {
                    actorId: 'system',
                    errorCode,
                    errorMessage: err.message,
                    reasonCode: 'SYNC_FAILURE'
                });
            }
            throw err;
        }
    }

    /**
     * Creates or updates a Kasa record in the accounting system for this bank connection.
     */
    private static async ensureKasaAccount(connection: any) {
        const companyId = connection.companyId;

        // Check if Kasa already exists for this connection
        let existingKasa = await (prisma as any).kasa.findUnique({
            where: { bankConnectionId: connection.id }
        });

        if (!existingKasa) {
            // DUPLICATE DETECTION: Check if any manual Kasa has the same IBAN
            const manualKasa = await (prisma as any).kasa.findFirst({
                where: {
                    companyId,
                    iban: connection.iban,
                    bankConnectionId: null // It's manual
                }
            });

            if (manualKasa) {
                console.log(`[BankSync] Duplicate IBAN detected for manual Kasa: ${manualKasa.name}. Linking instead of creating.`);
                existingKasa = await (prisma as any).kasa.update({
                    where: { id: manualKasa.id },
                    data: { bankConnectionId: connection.id }
                });
            } else {
                console.log(`[BankSync] Creating SSOT Kasa for bank: ${connection.bankName}`);
                existingKasa = await (prisma as any).kasa.create({
                    data: {
                        companyId,
                        name: `${connection.bankName} (${connection.iban.slice(-4)})`,
                        type: 'bank',
                        iban: connection.iban,
                        bankConnectionId: connection.id,
                        currency: connection.currency || 'TRY',
                        branch: 'Merkez',
                        isActive: true,
                        balance: 0
                    }
                });
            }
        }
        return existingKasa;
    }

    public static async processTransactions(connection: any, raw: RawBankTransaction[], mode: string = 'DRY_RUN') {
        let imported = 0;

        for (const tx of raw) {
            try {
                // 1. Generate Robust Fingerprint
                const fingerprint = generateTransactionFingerprint({
                    iban: connection.iban,
                    direction: tx.amount > 0 ? 'IN' : 'OUT',
                    amount: tx.amount.toString(),
                    currency: tx.currency,
                    bookingDate: new Date(tx.date).toISOString().split('T')[0],
                    description: tx.description,
                    bankRef: tx.reference || tx.id
                });

                // 2. Check idempotency via Fingerprint
                const existing = await (prisma as any).bankTransaction.findUnique({
                    where: {
                        bankConnectionId_transactionFingerprint: {
                            bankConnectionId: connection.id,
                            transactionFingerprint: fingerprint
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
                        transactionFingerprint: fingerprint,
                        amount: tx.amount,
                        currency: tx.currency,
                        description: tx.description,
                        transactionDate: new Date(tx.date),
                        direction: tx.amount > 0 ? 'IN' : 'OUT',
                        bankRef: tx.reference,
                        rawPayload: tx as any
                    }
                });

                // 5. Emit Domain Event for Reconciliation
                // If Mode is LIVE_PULL, we still emit but the Matchers might skip autonomous actions.
                // If mode is DRY_RUN, we pass it in metadata.
                await EventBus.emit({
                    companyId: connection.companyId,
                    eventType: 'BANK_TRANSACTION_IMPORTED',
                    aggregateType: 'JOURNAL', // Triggers accounting logic
                    aggregateId: newTx.id,
                    payload: { ...newTx, ...tags },
                    metadata: { mode }
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
