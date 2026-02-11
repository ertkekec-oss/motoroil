import prisma from '@/lib/prisma';
import { EventBus } from './event-bus';
import { AccountingEngine } from './accounting-engine';
import * as fs from 'fs';
import * as path from 'path';

export class PaymentMatchingEngine {
    private static EDGE_DIARY_PATH = path.join(process.cwd(), 'logs', 'fintech-edge.jsonl');
    private static SNAPSHOT_COUNT = 5;

    /**
     * Processes a newly imported bank transaction.
     * Matches against existing receivables or uses learning rules.
     */
    static async processBankTransaction(tx: any, event: any) {
        const { companyId, payload, aggregateId } = event;
        const bankTxId = aggregateId;
        const { description, amount, direction } = payload;

        console.log(`[FINTECH] Processing Bank Transaction: ${bankTxId} - ${amount} ${payload.currency}`);

        // 0. LIVE_MODE Guard: Hierarchy: Event Metadata > Env Var
        const mode = event.metadata?.mode || process.env.BANK_LIVE_MODE || 'DRY_RUN';
        const isLive = mode === 'LIVE_ALL' || process.env.FINTECH_LIVE_MODE === 'true';

        console.log(`[FINTECH] Processing Bank Transaction: ${bankTxId} (Mode: ${mode}, isLive: ${isLive})`);

        // 1. Snapshotting (First 5 transactions)
        await this.takeSnapshot(tx, companyId, payload);

        // 1. Check Learning Rules (AI/Pattern Matching)
        const rule = await this.findMatchingRule(companyId, description);

        let confidenceScore = 0;
        let matchDetails: any = null;

        if (rule) {
            confidenceScore = rule.confidence; // Usually 100 for learned rules
            matchDetails = { ruleId: rule.id, targetType: rule.targetType, accountCode: rule.accountCode };
        } else {
            // 2. Fallback: Systematic Match (Amount + fuzzy name)
            const systematicMatch = await this.systematicMatch(companyId, amount, description, direction);
            if (systematicMatch) {
                confidenceScore = systematicMatch.score;
                matchDetails = systematicMatch.details;
            }
        }

        // 3. Determine Confidence Bucket
        let confidenceBucket = 'LOW';
        if (confidenceScore >= 85) confidenceBucket = 'HIGH';
        else if (confidenceScore >= 60) confidenceBucket = 'MEDIUM';

        // 4. Record Match
        const match = await (tx as any).paymentMatch.create({
            data: {
                companyId,
                bankTransactionId: bankTxId,
                confidenceScore,
                confidenceBucket,
                matchType: rule ? 'RULE' : 'SYSTEMATIC',
                status: 'PENDING',
                ledgerId: matchDetails?.ledgerId,
                createdAt: new Date()
            }
        });

        // 5. Otonom Actions
        if (confidenceBucket === 'HIGH') {
            if (isLive) {
                await this.autoConfirmMatch(tx, match, matchDetails, event);
                // 5.1 FIRST_REAL_MONEY_RECEIVED Milestone
                await this.checkFirstMoneyMilestone(companyId);
            } else {
                console.warn(`[AUTOPILOT] DRY RUN: Auto-confirm skipped (LIVE_MODE=false)`);
            }
        } else if (confidenceBucket === 'MEDIUM') {
            console.log(`[PAYMENT_MATCH] Medium confidence match found for ${description}. Manual review suggested.`);
        } else {
            // LOW -> Suspense & Log Edge Case Diary
            await this.postToSuspense(tx, companyId, bankTxId, amount, description, isLive);
            await this.logEdgeCase(companyId, payload, confidenceScore, matchDetails);
        }

        return match;
    }

    private static async takeSnapshot(tx: any, companyId: string, payload: any) {
        try {
            const count = await (prisma as any).bankTransaction.count({ where: { companyId } });
            if (count < this.SNAPSHOT_COUNT) {
                const snapshotDir = path.join(process.cwd(), 'logs', 'snapshots');
                if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });
                const filePath = path.join(snapshotDir, `tx_${Date.now()}.json`);
                fs.writeFileSync(filePath, JSON.stringify({ payload, timestamp: new Date() }, null, 2));
            }
        } catch (e) { console.error('Snapshot error:', e); }
    }

    private static async logEdgeCase(companyId: string, payload: any, confidence: number, candidates: any) {
        const entry = {
            time: new Date().toISOString(),
            companyId,
            direction: payload.direction,
            amount: payload.amount,
            description: payload.description,
            confidence,
            topCandidates: candidates
        };
        try {
            const dir = path.dirname(this.EDGE_DIARY_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.appendFileSync(this.EDGE_DIARY_PATH, JSON.stringify(entry) + '\n');
        } catch (e) { console.error('Edge diary log error:', e); }
    }

    private static async checkFirstMoneyMilestone(companyId: string) {
        const existing = await (prisma as any).domainEvent.findFirst({
            where: { companyId, eventType: 'FIRST_REAL_MONEY_RECEIVED' }
        });
        if (!existing) {
            await EventBus.emit({
                companyId,
                eventType: 'FIRST_REAL_MONEY_RECEIVED',
                aggregateType: 'JOURNAL',
                aggregateId: 'SYSTEM',
                payload: { message: 'First real money processed autonomously!' }
            });
        }
    }

    private static async findMatchingRule(companyId: string, description: string) {
        const rules = await (prisma as any).matchingRule.findMany({
            where: { companyId, isActive: true }
        });

        // Simple substring pattern matching
        return rules.find((r: any) => description.toUpperCase().includes(r.pattern.toUpperCase()));
    }

    private static async systematicMatch(companyId: string, amount: number, description: string, direction: string) {
        // Look for open receivables (120.*) or payables (320.*)
        const accountPrefix = direction === 'IN' ? '120' : '320';

        const openLines = await (prisma as any).journalLine.findMany({
            where: {
                companyId,
                isOpen: true,
                accountCode: { startsWith: accountPrefix },
                OR: [
                    { debit: amount },
                    { credit: amount }
                ]
            },
            include: { journalEntry: true }
        });

        if (openLines.length === 1) {
            // Perfect amount match with only one open line
            return { score: 90, details: { ledgerId: openLines[0].journalEntryId, accountCode: openLines[0].accountCode } };
        }

        // Fuzzy matching logic could go here
        return null;
    }

    private static async autoConfirmMatch(tx: any, match: any, details: any, event: any) {
        console.log(`[AUTOPILOT] Auto-confirming HIGH confidence match for Match ID: ${match.id}`);

        // 1. Create Journal Entry via Accounting Engine
        const journal = await AccountingEngine.postToLedger(tx, {
            id: `MATCH_${match.id}`, // Unique ID for this accounting event
            companyId: match.companyId,
            eventType: 'BANK_MATCH_CONFIRMED',
            payload: {
                bankTransactionId: match.bankTransactionId,
                amount: event.payload.amount,
                accountCode: details.accountCode || '102.01', // Default bank account
                offsetAccountCode: details.targetType === 'EXPENSE' ? details.accountCode : '120.03'
            }
        });

        // 2. Update Match Status
        await tx.paymentMatch.update({
            where: { id: match.id },
            data: { status: 'CONFIRMED', journalEntryId: journal?.id }
        });

        // 3. Mark the bank transaction as reconciled
        await tx.bankTransaction.update({
            where: { id: match.bankTransactionId },
            data: { status: 'RECONCILED' }
        });
    }

    private static async postToSuspense(tx: any, companyId: string, bankTxId: string, amount: number, description: string, isLive: boolean) {
        if (!isLive) {
            console.log(`[FINTECH] DRY RUN: Suspense entry skipped for ${bankTxId}`);
            return;
        }
        // 397.01 - Pazaryeri Mutabakat Bekleyen Farklar / Suspense Account
        await AccountingEngine.postToLedger(tx, {
            id: `SUSPENSE_${bankTxId}`,
            companyId,
            eventType: 'BANK_TRANSACTION_SUSPENSE',
            payload: {
                bankTransactionId: bankTxId,
                amount,
                description: `Suspense: ${description}`,
                accountCode: '397.01'
            }
        });
    }

    /**
     * Phase 2.3: Self-learning
     * When a user manually matches a transaction, we learn the pattern.
     */
    static async learnPattern(companyId: string, description: string, targetType: string, accountCode: string) {
        // Extract a clean pattern (e.g., first 3 words or identifying tokens)
        const pattern = description.split(' ').slice(0, 3).join(' ').toUpperCase();

        const rule = await (prisma as any).matchingRule.create({
            data: {
                companyId,
                pattern,
                targetType,
                accountCode,
                confidence: 100,
                isActive: true
            }
        });

        await EventBus.emit({
            companyId,
            eventType: 'MATCHING_RULE_LEARNED',
            aggregateType: 'JOURNAL',
            aggregateId: rule.id,
            payload: rule
        });

        return rule;
    }
}
