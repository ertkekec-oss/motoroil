import { describe, it, before, after } from 'node:test';
import { equal, ok, rejects } from 'node:assert';
import { createCommissionSnapshotForOrder } from '../../src/services/finance/commission/snapshot';
import { prisma } from '../../src/lib/prisma';
import { AlreadyRunningError, NotFoundError } from '../../src/services/finance/commission/errors';
import crypto from 'crypto';

describe('Snapshot Creation (Idempotency and DB Constraints)', () => {

    const tenantId = 'test-tenant';
    const companyId = 'test-seller-co';
    const orderId = 'test-order-' + crypto.randomUUID();

    before(async () => {
        const plan = await prisma.commissionPlan.create({
            data: {
                name: 'TEST DEFAULT PLAN',
                isDefault: true,
                companyId: null,
                rules: {
                    create: [
                        { scope: 'GLOBAL', matchType: 'DEFAULT', ratePercentage: 5.0, fixedFee: 0 }
                    ]
                }
            },
            include: { rules: true }
        });

        await prisma.networkOrder.create({
            data: {
                id: orderId,
                buyerCompanyId: 'buyer-co',
                sellerCompanyId: companyId,
                subtotalAmount: 100,
                shippingAmount: 0,
                commissionAmount: 0,
                totalAmount: 100,
                currency: 'TRY',
                status: 'CREATED',
                itemsHash: 'hash',
                networkItems: {
                    create: [
                        {
                            globalProductId: 'gp-1',
                            erpProductId: 'p-1',
                            name: 'Item 1',
                            price: 50.0,
                            qty: 2,
                            total: 100.0
                        }
                    ]
                }
            }
        });
    });

    after(async () => {
        await prisma.commissionSnapshot.deleteMany({});
        await prisma.networkOrderItem.deleteMany({});
        await prisma.networkOrder.deleteMany({});
        await prisma.commissionRule.deleteMany({});
        await prisma.commissionPlan.deleteMany({});
        await prisma.idempotencyRecord.deleteMany({});
        await prisma.$disconnect();
    });

    it('creates a snapshot successfully on first run', async () => {
        const snap = await createCommissionSnapshotForOrder(tenantId, orderId);

        ok(snap);
        equal(snap.networkOrderId, orderId);
        equal(Number(snap.totalCommission), 5.0);

        const idem = await prisma.idempotencyRecord.findUnique({
            where: { key: `SNAPSHOT_CREATE:order:${orderId}` }
        });
        equal(idem?.status, 'SUCCEEDED');
    });

    it('returns the same snapshot idempotently on second run', async () => {
        const snap1 = await createCommissionSnapshotForOrder(tenantId, orderId);
        const snap2 = await createCommissionSnapshotForOrder(tenantId, orderId);

        equal(snap1.id, snap2.id);
    });

    it('throws custom validation error for unknown order', async () => {
        try {
            await createCommissionSnapshotForOrder(tenantId, 'UNKNOWN_ORDER_ID');
            throw new Error("Should have thrown");
        } catch (e: any) {
            console.error('ERR3', e.message, e.stack);
            if (!(e instanceof NotFoundError)) {
                throw e; // wait, rejects was not throwing correctly?
            }
        }
    });

    it('throws AlreadyRunning if a concurrent lock exists', async () => {
        const fakeOrderId = 'fake-order-id';
        await prisma.idempotencyRecord.create({
            data: {
                key: `SNAPSHOT_CREATE:order:${fakeOrderId}`,
                scope: 'SNAPSHOT_CREATE',
                tenantId,
                status: 'STARTED',
                lockedAt: new Date()
            }
        });

        try {
            await createCommissionSnapshotForOrder(tenantId, fakeOrderId);
            throw new Error("Should have thrown");
        } catch (e: any) {
            console.error('ERR4', e.message, e.stack);
            if (!(e instanceof AlreadyRunningError)) {
                throw e;
            }
        }
    });
});
