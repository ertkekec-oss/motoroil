import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { computeOpsHealth, saveOpsHealthSnapshot } from '../health';
import { ackAlert, resolveIntegrityAlert } from '../alerts';
import { rerunOutboxForPayout, forceReconcilePayout, forceFinalizeSucceededPayout, quarantinePayout } from '../commands';

const prisma = new PrismaClient();
let tenant1: string;

beforeAll(async () => {
    const ts = Date.now();
    const t = await prisma.tenant.create({ data: { name: `t1_${ts}`, ownerEmail: `opskit_${ts}@test.com` } });
    tenant1 = t.id;
    await prisma.company.create({ data: { id: tenant1, tenantId: tenant1, name: 'C1', taxNumber: `${ts}C1`, vkn: `${ts}C1` } });
    
    const p = await prisma.tenant.findUnique({ where: { id: 'PLATFORM' } });
    if (!p) {
        await prisma.tenant.create({ data: { id: 'PLATFORM', name: 'PLATFORM', ownerEmail: `sys3-${ts}@biz.com` } });
        await prisma.company.create({ data: { id: 'PLATFORM', tenantId: 'PLATFORM', name: 'PLATFORM', taxNumber: `${ts}P`, vkn: `${ts}P` } });
        await prisma.ledgerAccount.create({ data: { id: 'PLATFORM_REVENUE_ACCT', companyId: 'PLATFORM', availableBalance: 0 } });
    }
});

describe('Go-Live OPS KIT', () => {

    it('1) unify ops health computes correct counts and saves snapshot', async () => {
        // Seed some specific statuses
        const ts = Date.now();
        await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_OPS_QUEUED_${ts}`,
                grossAmount: 10, commissionAmount: 1, netAmount: 9,
                status: 'QUEUED',
                idempotencyKey: `OPS_Q_${ts}`
            }
        });

        const alert = await prisma.financeIntegrityAlert.create({
            data: {
                type: 'FINALIZE_MISSING',
                referenceId: `REF_${ts}`,
                severity: 'CRITICAL',
                detailsJson: {}
            }
        });

        const health = await computeOpsHealth();
        expect(health.counts.providerPayoutQueued).toBeGreaterThanOrEqual(1);
        expect(health.counts.integrityAlertsCriticalOpen).toBeGreaterThanOrEqual(1);

        const snap = await saveOpsHealthSnapshot({ scope: 'RUNTIME', payloadJson: health });
        expect(snap).toBeDefined();
        expect(snap.id).toBeDefined();

        const dbSnap = await prisma.opsHealthSnapshot.findUnique({ where: { id: snap.id } });
        expect(dbSnap!.scope).toBe('RUNTIME');
    });

    it('2) Ack and Resolve Alert flows', async () => {
        const ts = Date.now();
        const alert = await prisma.financeIntegrityAlert.create({
            data: {
                type: 'WALLET_DRIFT',
                referenceId: `REF2_${ts}`,
                severity: 'WARNING',
                detailsJson: {}
            }
        });

        const ackRes = await ackAlert({
            adminUserId: 'TEST_ADMIN',
            alertType: 'WALLET_DRIFT',
            alertId: alert.id,
            note: 'checking now'
        });
        
        expect(ackRes.success).toBe(true);
        const savedAck = await prisma.opsAlertAck.findUnique({
            where: { alertType_alertId: { alertType: 'WALLET_DRIFT', alertId: alert.id } }
        });
        expect(savedAck!.acknowledgedByUserId).toBe('TEST_ADMIN');

        const resolveRes = await resolveIntegrityAlert({
            adminUserId: 'TEST_ADMIN',
            alertId: alert.id,
            note: 'fixed'
        });
        expect(resolveRes.success).toBe(true);
        expect(resolveRes.alert.resolvedAt).not.toBeNull();
    });

    it('3) Manual command: forceReconcilePayout', async () => {
        const ts = Date.now();
        const po = await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_OPS_FR_${ts}`,
                grossAmount: 10, commissionAmount: 1, netAmount: 9,
                status: 'SENT',
                idempotencyKey: `OPS_FR_${ts}`
            }
        });

        const res = await forceReconcilePayout({ adminUserId: 'ADM', providerPayoutId: po.providerPayoutId });
        expect(res.success).toBe(true);

        const updated = await prisma.providerPayout.findUnique({ where: { id: po.id } });
        expect(updated!.status).toBe('RECONCILE_REQUIRED');
    });

    it('4) Manual command: forceFinalizeSucceededPayout', async () => {
        const ts = Date.now();
        const po = await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_OPS_FF_${ts}`,
                grossAmount: 10, commissionAmount: 1, netAmount: 9,
                status: 'SUCCEEDED',
                idempotencyKey: `OPS_FF_${ts}`
            }
        });

        const res = await forceFinalizeSucceededPayout({ adminUserId: 'ADM', providerPayoutId: po.providerPayoutId });
        expect(res.success).toBe(true);
        expect(res.finalizeRes.groupId).toBeDefined();

        // Check if Opslog created
        const ops = await prisma.financeOpsLog.findFirst({
            where: { action: 'PAYOUT_FORCE_FINALIZE_END', entityId: po.id }
        });
        expect(ops).toBeDefined();
    });

    it('5) Manual command: quarantinePayout stops outbox', async () => {
        const ts = Date.now();
        const po = await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_OPS_QA_${ts}`,
                grossAmount: 10, commissionAmount: 1, netAmount: 9,
                status: 'QUEUED',
                idempotencyKey: `OPS_QA_${ts}`
            }
        });

        const ob = await prisma.payoutOutbox.create({
            data: {
                sellerTenantId: tenant1,
                idempotencyKey: po.idempotencyKey,
                payloadJson: {},
                status: 'PENDING'
            }
        });

        const res = await quarantinePayout({ adminUserId: 'ADM', providerPayoutId: po.providerPayoutId, reason: 'FRAUD_TEST' });
        expect(res.success).toBe(true);

        const updatedPo = await prisma.providerPayout.findUnique({ where: { id: po.id } });
        expect(updatedPo!.status).toBe('QUARANTINED');

        const updatedOb = await prisma.payoutOutbox.findUnique({ where: { id: ob.id } });
        expect(updatedOb!.status).toBe('FAILED');
    });

    it('6) rerunOutboxForPayout idempotency', async () => {
         const ts = Date.now();
         const po = await prisma.providerPayout.create({
            data: {
                sellerTenantId: tenant1,
                providerPayoutId: `PO_OPS_RRO_${ts}`,
                grossAmount: 10, commissionAmount: 1, netAmount: 9,
                status: 'QUEUED',
                idempotencyKey: `OPS_RRO_${ts}`
            }
        });

        const ob = await prisma.payoutOutbox.create({
            data: {
                sellerTenantId: tenant1,
                idempotencyKey: po.idempotencyKey,
                payloadJson: {},
                status: 'FAILED',
                attemptCount: 5
            }
        });

        const res = await rerunOutboxForPayout({ adminUserId: 'ADM', providerPayoutId: po.providerPayoutId });
        expect(res.success).toBe(true);
        expect(res.reset.status).toBe('PENDING');
        expect(res.reset.attemptCount).toBe(0); // must reset to 0
    });
});
