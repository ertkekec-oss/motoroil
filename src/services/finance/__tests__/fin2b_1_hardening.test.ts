import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

import { runFinanceIntegrityCheck } from '../integrity/sentinel';
import { runProviderPayoutReconcileCycle } from '../payout/iyzico/reconcilePull';
import { ingestWebhook } from '../payout/iyzico/webhooks';
import { runStuckPayoutRepair } from '../payout/repair';
import { finalizePayoutLedger } from '../payout/ledgerFinalize';

const prisma = new PrismaClient();

let tenant1: string;

beforeAll(async () => {
    const ts = Date.now();
    const t = await prisma.tenant.create({ data: { name: `t1_${ts}`, ownerEmail: `hard_${ts}@test.com` } });
    tenant1 = t.id;
    await prisma.company.create({ data: { id: tenant1, tenantId: tenant1, name: 'C1', taxNumber: `${ts}C1`, vkn: `${ts}C1` } });
    await prisma.ledgerAccount.create({ data: { companyId: tenant1, availableBalance: 100 } });
    
    // Ensure platform exists for finalization
    const p = await prisma.tenant.findUnique({ where: { id: 'PLATFORM' } });
    if (!p) {
        await prisma.tenant.create({ data: { id: 'PLATFORM', name: 'PLATFORM', ownerEmail: `sys2-${ts}@biz.com` } });
        await prisma.company.create({ data: { id: 'PLATFORM', tenantId: 'PLATFORM', name: 'PLATFORM', taxNumber: `${ts}P`, vkn: `${ts}P` } });
        await prisma.ledgerAccount.create({ data: { id: 'PLATFORM_REVENUE_ACCT', companyId: 'PLATFORM', availableBalance: 0 } });
    }
});

describe('FIN-2B.1: Production Hardening', () => {

    it('1) Ledger Imbalance Detection', async () => {
        // Create broken ledger
        const badGroup = await prisma.ledgerGroup.create({
            data: {
                tenantId: tenant1,
                idempotencyKey: `BAD_GROUP_${Date.now()}`,
                type: 'IYZICO_PAYOUT_FINALIZE',
                description: 'Broken group'
            }
        });

        const ledger = await prisma.ledgerAccount.findUnique({ where: { companyId: tenant1 } });
        // Insert only DEBIT
        await prisma.ledgerEntry.create({
            data: {
                tenantId: tenant1,
                groupId: badGroup.id,
                ledgerAccountId: ledger!.id,
                accountType: 'SELLER_WALLET_AVAILABLE',
                direction: 'DEBIT',
                amount: 100,
                currency: 'TRY'
            }
        });

        const res = await runFinanceIntegrityCheck();
        expect(res.findingCount).toBeGreaterThanOrEqual(1);

        const alert = await prisma.financeIntegrityAlert.findFirst({
            where: { type: 'LEDGER_UNBALANCED', referenceId: badGroup.id }
        });
        expect(alert).toBeDefined();
        expect(alert!.severity).toBe('CRITICAL');
    });

    it('2) Missing Finalize Detection', async () => {
        // Create Payout SUCCEEDED but no LedgerGroup created
        const pout = await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_NO_LEDGER_${Date.now()}`,
                grossAmount: 100,
                commissionAmount: 10,
                netAmount: 90,
                status: 'SUCCEEDED',
                idempotencyKey: `IDEM_${Date.now()}`
            }
        });

        await runFinanceIntegrityCheck();

        const alert = await prisma.financeIntegrityAlert.findFirst({
            where: { type: 'FINALIZE_MISSING', referenceId: pout.id }
        });
        expect(alert).toBeDefined();
    });

    it('3) Reconcile Pull Success', async () => {
        // Create old SENT payout
        const oldSent = await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_RECONCILE_${Date.now()}`,
                grossAmount: 50,
                commissionAmount: 5,
                netAmount: 45,
                status: 'SENT',
                idempotencyKey: `IDEM_RC_${Date.now()}`,
                updatedAt: new Date(Date.now() - 15 * 60000) // 15 mins ago
            }
        });

        // Our MockProvider returns SUCCEEDED on getPayoutStatus
        const res = await runProviderPayoutReconcileCycle();
        expect(res.correctedCount).toBeGreaterThanOrEqual(1);

        const updated = await prisma.providerPayout.findUnique({ where: { id: oldSent.id }});
        expect(updated!.status).toBe('SUCCEEDED');

        // Check it finalized
        const group = await prisma.ledgerGroup.findUnique({
             where: { idempotencyKey: `PAYOUT_FINALIZE:${oldSent.providerPayoutId}` }
        });
        expect(group).toBeDefined();
    });

    it('4) Webhook Expired Timestamp', async () => {
        const payloadStr = JSON.stringify({ iyziEventType: 'TEST', iyziEventTime: Date.now() });
        const secret = process.env.IYZICO_SECRET_KEY || 'dummy_secret';
        const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

        // Old timestamp
        const oldTimestamp = Date.now() - 10 * 60000;

        await expect(ingestWebhook(signature, payloadStr, JSON.parse(payloadStr), oldTimestamp.toString()))
            .rejects.toThrow('Expired timestamp');
    });

    it('5) Webhook Replay', async () => {
        const ts = Date.now();
        const payloadStr = JSON.stringify({ iyziEventType: 'REPLAY_TEST', iyziEventTime: ts });
        const secret = process.env.IYZICO_SECRET_KEY || 'dummy_secret';
        const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
        
        // First should succeed
        const res1 = await ingestWebhook(signature, payloadStr, JSON.parse(payloadStr), ts.toString());
        expect(res1).toBeDefined();

        // Second should fail with Replayed payload
        await expect(ingestWebhook(signature, payloadStr, JSON.parse(payloadStr), ts.toString()))
            .rejects.toThrow('Replayed payload');

        // Check Ops Log
        const ops = await prisma.financeOpsLog.findFirst({
            where: { action: 'WEBHOOK_REPLAY_REJECTED' },
            orderBy: { createdAt: 'desc' }
        });
        expect(ops).toBeDefined();
    });

    it('6) Stuck Outbox Reset', async () => {
        const oldSending = await prisma.payoutOutbox.create({
            data: {
                sellerTenantId: tenant1,
                idempotencyKey: `STUCK_${Date.now()}`,
                status: 'SENDING',
                payloadJson: {},
                updatedAt: new Date(Date.now() - 20 * 60000) // 20 mins ago
            }
        });

        const res = await runStuckPayoutRepair();
        expect(res.correctedCount).toBeGreaterThanOrEqual(1);

        const reset = await prisma.payoutOutbox.findUnique({ where: { id: oldSending.id }});
        expect(reset!.status).toBe('PENDING');
        expect(reset!.attemptCount).toBe(1);
    });

    it('7) Idempotent finalize not duplicated', async () => {
         const payout = await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_IDEMP_${Date.now()}`,
                grossAmount: 100,
                commissionAmount: 10,
                netAmount: 90,
                status: 'SUCCEEDED',
                idempotencyKey: `IDEM2_${Date.now()}`
            }
        });

        const r1 = await finalizePayoutLedger({ providerPayoutId: payout.providerPayoutId });
        expect(r1.success).toBe(true);
        expect(r1.groupId).toBeDefined();

        const r2 = await finalizePayoutLedger({ providerPayoutId: payout.providerPayoutId });
        expect(r2.message).toBe('Already processed');
        
        const groups = await prisma.ledgerGroup.count({
            where: { idempotencyKey: `PAYOUT_FINALIZE:${payout.providerPayoutId}` }
        });
        expect(groups).toBe(1); // not duplicated
    });
});
