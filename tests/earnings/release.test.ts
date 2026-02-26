import { describe, it, before, after } from 'node:test';
import { equal, ok, rejects } from 'node:assert';
import { prisma } from '../../src/lib/prisma';
import { releaseSingleEarning } from '../../src/services/finance/earnings/releaseSingle';
import { TENANT_PLATFORM, LedgerAccountType, LedgerDirection } from '../../src/services/finance/earnings/ledgerPosting';
import { AlreadyRunningError, ValidationError } from '../../src/services/finance/earnings/errors';
import crypto from 'crypto';

describe('Earnings Release Engine', () => {

    const tenantId = 'test-seller-co-' + crypto.randomUUID();
    const shipmentId = 'test-shipment-' + crypto.randomUUID();
    const orderId = 'test-order-' + crypto.randomUUID();
    let earningId: string;

    const platCompanyId = TENANT_PLATFORM;

    before(async () => {
        // Minimal setup
        // Create platform tenant first (for the foreign key constraint)
        const platTenant = await prisma.tenant.create({
            data: {
                name: 'Platform Tenant Core',
                ownerEmail: 'admin' + Math.floor(Math.random() * 1000).toString() + '@example.com'
            }
        });

        await prisma.company.upsert({
            where: { id: platCompanyId },
            update: {},
            create: {
                id: platCompanyId,
                tenantId: platTenant.id,
                name: 'Platform Tenant',
                type: 'PLATFORM',
                status: 'ACTIVE',
                vkn: '99999999' + Math.floor(Math.random() * 10).toString(),
                taxOffice: 'Test',
                taxNumber: '99999999' + Math.floor(Math.random() * 10).toString(),
            }
        });

        await prisma.company.create({
            data: {
                id: tenantId,
                tenantId: platTenant.id, // Points to the created platform tenant
                name: 'Test Seller',
                type: 'SELLER',
                status: 'ACTIVE',
                vkn: '11111111' + Math.floor(Math.random() * 10).toString(),
                taxOffice: 'Test',
                taxNumber: '11111111' + Math.floor(Math.random() * 10).toString(),
            }
        });

        await prisma.networkOrder.create({
            data: {
                id: orderId,
                buyerCompanyId: 'buyer-co',
                sellerCompanyId: tenantId,
                subtotalAmount: 100,
                shippingAmount: 0,
                commissionAmount: 0,
                totalAmount: 100,
                currency: 'TRY',
                status: 'CREATED',
                itemsHash: 'hash'
            }
        });

        await prisma.shipment.create({
            data: {
                id: shipmentId,
                networkOrderId: orderId,
                mode: 'INTEGRATED',
                carrierCode: 'KARGO',
            }
        });

        await prisma.ledgerAccount.create({
            data: {
                companyId: tenantId,
                availableBalance: 0,
                pendingBalance: 0,
                currency: 'TRY'
            }
        });

        const earning = await prisma.sellerEarning.create({
            data: {
                sellerCompanyId: tenantId,
                shipmentId: shipmentId,
                grossAmount: 100,
                commissionAmount: 10,
                chargebackAmount: 0,
                netAmount: 90,
                status: 'CLEARED',
                expectedClearDate: new Date(Date.now() - 24 * 3600 * 1000) // Yesterday
            }
        });
        earningId = earning.id;
    });

    after(async () => {
        // Cleanup reverse order
        await prisma.ledgerEntry.deleteMany({});
        await prisma.ledgerGroup.deleteMany({});
        await prisma.ledgerAccount.deleteMany({});
        await prisma.idempotencyRecord.deleteMany({});
        await prisma.sellerEarning.deleteMany({});
        await prisma.shipment.deleteMany({});
        await prisma.networkOrder.deleteMany({});
        await prisma.company.deleteMany({ where: { id: tenantId } });
        await prisma.$disconnect();
    });

    it('processes release correctly applying ledger entries', async () => {
        await releaseSingleEarning(earningId);

        // Assert Status Update
        const updated = await prisma.sellerEarning.findUnique({ where: { id: earningId } });
        equal(updated?.status, 'RELEASED');
        ok(updated?.releasedAt);

        // Assert Ledger Posting
        const groups = await prisma.ledgerGroup.findMany({
            where: { idempotencyKey: `EARNING_RELEASE:earning:${earningId}` },
            include: { entries: true }
        });

        equal(groups.length, 1);
        const group = groups[0];

        // Assert Platform Entries exist & are correct
        const liabilityEntry = group.entries.find(e => e.accountType === LedgerAccountType.ESCROW_LIABILITY);
        ok(liabilityEntry);
        equal(Number(liabilityEntry.amount), 100);
        equal(liabilityEntry.direction, LedgerDirection.DEBIT);
        equal(liabilityEntry.tenantId, TENANT_PLATFORM);

        const revEntry = group.entries.find(e => e.accountType === LedgerAccountType.PLATFORM_REVENUE_COMMISSION);
        ok(revEntry);
        equal(Number(revEntry.amount), 10);
        equal(revEntry.direction, LedgerDirection.CREDIT);
        equal(revEntry.tenantId, TENANT_PLATFORM);

        // Assert Seller Entries
        const payableEntry = group.entries.find(e => e.accountType === LedgerAccountType.SELLER_PAYABLE);
        ok(payableEntry);
        equal(Number(payableEntry.amount), 90);
        equal(payableEntry.direction, LedgerDirection.CREDIT);
        equal(payableEntry.tenantId, tenantId); // Seller Tenant
    });

    it('rejects concurrent executions idempotently', async () => {
        const dummyKey = `EARNING_RELEASE:earning:fake-id`;
        await prisma.idempotencyRecord.create({
            data: {
                key: dummyKey,
                scope: 'EARNING_RELEASE',
                tenantId,
                status: 'STARTED',
                lockedAt: new Date()
            }
        });

        await rejects(
            releaseSingleEarning('fake-id'),
            AlreadyRunningError
        );
    });

    it('no-ops safely on subsequent calls for completed earnings', async () => {
        // Should not throw and should not create a second group
        await releaseSingleEarning(earningId);

        const groups = await prisma.ledgerGroup.count({
            where: { idempotencyKey: `EARNING_RELEASE:earning:${earningId}` }
        });

        // Still exactly 1 group even after double call
        equal(groups, 1);
    });
});
