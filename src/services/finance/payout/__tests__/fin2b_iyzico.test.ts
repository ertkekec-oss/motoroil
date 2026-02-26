import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createOrUpdateSubMerchantForSeller } from '../iyzico/onboarding';
import { enqueueReleasePayout } from '../iyzico/releasePayout';
import { runPayoutOutboxCycle } from '../iyzico/outboxWorker';
import { processWebhookEvents, ingestWebhook } from '../iyzico/webhooks';
import { finalizePayoutLedger } from '../ledgerFinalize';
import { handleRefundOrChargeback } from '../refunds';
import { encryptIban } from '../pii';
import crypto from 'crypto';

const prisma = new PrismaClient();

let tenant1: string, tenant2: string, dest1Id: string;
let shipment1 = `SHIP_${Date.now()}`;
let payoutEnqueuedId: string;
let providerPayoutIdMock: string;
let originalProviderPaymentId: string;

beforeAll(async () => {
    // Setup basic fixtures
    const ts = Date.now();

    // Create Tenant and Company directly, or via Prisma
    const t1 = await prisma.tenant.create({ data: { name: 't1_biz', ownerEmail: `t1-${ts}@biz.com` } });
    const t2 = await prisma.tenant.create({ data: { name: 't2_biz', ownerEmail: `t2-${ts}@biz.com` } });
    tenant1 = t1.id;
    tenant2 = t2.id;

    const c1 = await prisma.company.create({ data: { id: tenant1, tenantId: tenant1, name: 'C1 Biz', taxNumber: `${ts}C1`, vkn: `${ts}C1` } });
    await prisma.company.create({ data: { id: tenant2, tenantId: tenant2, name: 'C2 Biz', taxNumber: `${ts}C2`, vkn: `${ts}C2` } });

    // Dest 
    const dest = await prisma.payoutDestination.create({
        data: {
            sellerTenantId: tenant1,
            type: 'IBAN',
            ibanMasked: `TR12***${ts}`,
            ibanEncrypted: encryptIban(`TR12345678901234567890${ts}`.substring(0, 26)),
            holderNameMasked: 'T*** U***',
            status: 'ACTIVE'
        }
    });
    dest1Id = dest.id;

    // Platform Company & Ledger for FIN-2B finalizer mock
    const tP = await prisma.tenant.create({ data: { id: 'PLATFORM', name: 'PLATFORM', ownerEmail: `sys-${ts}@biz.com` } });
    await prisma.company.create({ data: { id: 'PLATFORM', tenantId: 'PLATFORM', name: 'PLATFORM', taxNumber: `${ts}P`, vkn: `${ts}P` } });
    await prisma.ledgerAccount.create({ data: { id: 'PLATFORM_REVENUE_ACCT', companyId: 'PLATFORM', availableBalance: 0 } });

    // Ledgers for test 7
    await prisma.ledgerAccount.create({ data: { companyId: tenant1, availableBalance: 100 } });
});

describe('FIN-2B: External Payout Orchestration (Iyzico)', () => {

    it('1) Sub Merchant Onboarding & Outbox Idempotency', async () => {
        // Onboard (creates SellerPaymentProfile)
        const profile = await createOrUpdateSubMerchantForSeller(tenant1, dest1Id, {});
        expect(profile.provider).toBe('IYZICO');
        expect(profile.subMerchantKey).toContain('mock_smk_');

        // Enqueue Release Payout
        const payout = await enqueueReleasePayout({
            shipmentId: shipment1,
            sellerTenantId: tenant1,
            grossAmount: 110,
            commissionAmount: 10,
            netAmount: 100
        });

        expect(payout.status).toBe('QUEUED');
        providerPayoutIdMock = payout.providerPayoutId;
        payoutEnqueuedId = payout.id;

        // Double Enqueue should return same object without error or duplicate DB rows
        const payoutDup = await enqueueReleasePayout({
            shipmentId: shipment1,
            sellerTenantId: tenant1,
            grossAmount: 110,
            commissionAmount: 10,
            netAmount: 100
        });
        expect(payoutDup.id).toBe(payout.id);

        const outboxCount = await prisma.payoutOutbox.count({ where: { idempotencyKey: payout.idempotencyKey } });
        expect(outboxCount).toBe(1);
    });

    it('2) Outbox Sending & Double Send Prevention', async () => {
        // Run worker
        const res = await runPayoutOutboxCycle({ batchSize: 5 });
        expect(res.processedCount).toBeGreaterThanOrEqual(1);

        // State changes to SENT
        const pout = await prisma.providerPayout.findUnique({ where: { providerPayoutId: providerPayoutIdMock } });
        expect(pout!.status).toBe('SENT');

        const box = await prisma.payoutOutbox.findFirst({ where: { payloadJson: { path: ['providerPayoutId'], equals: providerPayoutIdMock } as any } });
        expect(box!.status).toBe('SENT');

        // Second run shouldn't process SENT items
        const res2 = await runPayoutOutboxCycle({ batchSize: 5 });
        expect(res2.processedCount).toBe(0); // Assuming no other pending
    });

    it('3) Webhook Ingest Idempotency & Signature Guard', async () => {
        const payloadStr = JSON.stringify({
            iyziEventType: 'PAYOUT_SUCCEEDED',
            iyziEventTime: Date.now(),
            providerPayoutId: providerPayoutIdMock
        });

        // 3a. Invalid sig
        await expect(ingestWebhook('bad_sig', payloadStr, JSON.parse(payloadStr)))
            .rejects.toThrow('Invalid signature');

        // 3b. Valid sig
        const secret = process.env.IYZICO_SECRET_KEY || 'dummy_secret';
        const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

        const ok = await ingestWebhook(expectedSig, payloadStr, JSON.parse(payloadStr));
        expect(ok!.status).toBe('RECEIVED');

        // 3c. Duplicate ingest returns null, no throw
        const okDup = await ingestWebhook(expectedSig, payloadStr, JSON.parse(payloadStr));
        expect(okDup).toBeNull();
    });

    it('4) Webhook Processing loops', async () => {
        await processWebhookEvents();

        // Payout should now be SUCCEEDED based on webhook
        const pout = await prisma.providerPayout.findUnique({ where: { providerPayoutId: providerPayoutIdMock } });
        expect(pout!.status).toBe('SUCCEEDED');
    });

    it('5) Ledger Finalize Exactly Once', async () => {
        // Process
        const res = await finalizePayoutLedger({ providerPayoutId: providerPayoutIdMock });
        expect(res.success).toBe(true);
        expect(res.groupId).toBeDefined();

        // Double call yields fast-return "Already processed"
        const res2 = await finalizePayoutLedger({ providerPayoutId: providerPayoutIdMock });
        expect(res2.message).toBe('Already processed');

        // Ledgers were created (Group + Comm Entry + Wallet Entry)
        const entries = await prisma.ledgerEntry.findMany({ where: { groupId: res.groupId! } });
        expect(entries.length).toBe(2);

        // Check platform and seller accounting lines
        expect(entries.find(e => e.accountType === 'PLATFORM_REVENUE' && Number(e.amount) === 10)).toBeDefined();
        expect(entries.find(e => e.accountType === 'SELLER_PAYOUT_OUT' && Number(e.amount) === 100)).toBeDefined();
    });

    it('6) Seller Isolation', async () => {
        // Enqueue missing profile should throw
        await expect(enqueueReleasePayout({
            shipmentId: 'foo',
            sellerTenantId: tenant2, // no profile added
            grossAmount: 10,
            commissionAmount: 1,
            netAmount: 9
        })).rejects.toThrow(/Seller not onboarded/);
    });

    it('7) Refund & Chargeback Handle Seller Wallet Deduct', async () => {
        // Let's create a ProviderPayment
        originalProviderPaymentId = `PPMT_${Date.now()}`;
        await prisma.providerPayment.create({
            data: {
                tenantId: tenant2, // arbitrary buyer
                providerPaymentId: originalProviderPaymentId,
                networkPaymentId: `N_PMT_${Date.now()}`,
                amount: 50,
                status: 'PAID'
            }
        });

        // Current wallet (from BeforeAll) = 100
        const charge = await handleRefundOrChargeback({
            providerPaymentId: originalProviderPaymentId,
            amount: 50,
            reason: 'Fraud',
            isChargeback: true
        });

        expect(charge.success).toBe(true);

        const pmInfo = await prisma.providerPayment.findUnique({ where: { providerPaymentId: originalProviderPaymentId } });
        expect(pmInfo!.status).toBe('CHARGEBACK');

        const sellerLedger = await prisma.ledgerAccount.findUnique({ where: { companyId: tenant1 } }); // it found the generic SUCCEEDED payout we ran
        expect(Number(sellerLedger!.availableBalance)).toBe(50); // 100 - 50 chargeback deducted
    });
});
