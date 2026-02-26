import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createPayoutDestination, listPayoutDestinations } from '../destinations';
import { createPayoutRequest, approvePayoutRequest, rejectPayoutRequest } from '../requests';
import { processPayoutRequestInternal } from '../processInternal';

const prisma = new PrismaClient();

let tenant1: string, tenant2: string, adminUser: string;
let ledger1Id: string, dest1Id: string;
let req1Id: string, reqFailId: string;

beforeAll(async () => {
    // Minimal standard test setup
    const ts = Date.now();
    adminUser = `admin_${ts}`;

    const t1 = await prisma.tenant.create({ data: { name: 't1', ownerEmail: `t1-${ts}@test.com` } });
    const t2 = await prisma.tenant.create({ data: { name: 't2', ownerEmail: `t2-${ts}@test.com` } });
    tenant1 = t1.id;
    tenant2 = t2.id;

    await prisma.company.create({ data: { id: tenant1, tenantId: tenant1, name: 'C1', taxNumber: `${ts}1`, vkn: `${ts}1` } });
    await prisma.company.create({ data: { id: tenant2, tenantId: tenant2, name: 'C2', taxNumber: `${ts}2`, vkn: `${ts}2` } });

    // Provide some funds
    const l1 = await prisma.ledgerAccount.create({
        data: { companyId: tenant1, availableBalance: 1000 }
    });
    ledger1Id = l1.id;

    await prisma.ledgerAccount.create({
        data: { companyId: tenant2, availableBalance: 500 }
    });
});

describe('FIN-2A: Internal Wallet Withdrawals', () => {

    it('1) Destination create returns masked IBAN; raw hidden; idempotent', async () => {
        const d1 = await createPayoutDestination({
            sellerTenantId: tenant1,
            rawIban: 'TR123456789012345678901234',
            holderName: 'Alice Smith',
            setDefault: true
        });

        expect(d1.ibanMasked).not.toContain('TR123456789012345678901234');
        expect(d1.ibanMasked).toContain('***');
        expect((d1 as any).rawIban).toBeUndefined();
        dest1Id = d1.id;

        // Duplicate create should no-op and return existing without error
        const d_dup = await createPayoutDestination({
            sellerTenantId: tenant1,
            rawIban: 'TR123456789012345678901234',
            holderName: 'Alice Smith',
            setDefault: true
        });
        expect(d_dup.id).toBe(dest1Id);
    });

    it('2) Seller cannot access another seller destinations (tested implicitly via isolation bounds)', async () => {
        const destsT2 = await listPayoutDestinations(tenant2);
        expect(destsT2.length).toBe(0);

        const destsT1 = await listPayoutDestinations(tenant1);
        expect(destsT1.length).toBe(1);
        expect(destsT1[0].id).toBe(dest1Id);
    });

    it('3) Create payout request rejects invalid amount or destination', async () => {
        await expect(createPayoutRequest({
            sellerTenantId: tenant1,
            destinationId: dest1Id,
            amount: 0,
            currency: 'TRY',
            userId: 'u1'
        })).rejects.toThrow(/Amount must be greater/);

        await expect(createPayoutRequest({
            sellerTenantId: tenant2,
            destinationId: dest1Id, // Dest belongs to T1
            amount: 100,
            currency: 'TRY',
            userId: 'u2'
        })).rejects.toThrow(/Destination not found/);
    });

    it('4) Approve + process internal works, modifies ledger once, status flows correctly', async () => {
        // Create Request (100)
        const req = await createPayoutRequest({
            sellerTenantId: tenant1,
            destinationId: dest1Id,
            amount: 100,
            currency: 'TRY',
            userId: 'u1'
        });
        req1Id = req.id;
        expect(req.status).toBe('REQUESTED');

        // Approve
        const approved = await approvePayoutRequest({
            adminUserId: adminUser,
            payoutRequestId: req.id
        });
        expect(approved.status).toBe('APPROVED');

        // Process Internal
        const processed = await processPayoutRequestInternal({
            payoutRequestId: req.id,
            adminUserId: adminUser
        });
        expect(processed.status).toBe('PAID_INTERNAL');

        // Balance Check
        const l1 = await prisma.ledgerAccount.findUnique({ where: { id: ledger1Id } });
        expect(Number(l1!.availableBalance)).toBe(900); // 1000 - 100
        expect(Number(l1!.reservedBalance)).toBe(0);

        // Ledger verify
        const entries = await prisma.ledgerEntry.findMany({
            where: { tenantId: tenant1, referenceId: req.id }
        });
        expect(entries.length).toBe(4); // reserve (avail, rsv) + complete (rsv, out)
    });

    it('5) Insufficient balances at processing fails safely', async () => {
        // Let's modify balance to bypass soft check:
        await prisma.ledgerAccount.update({ where: { id: ledger1Id }, data: { availableBalance: 2000 } });

        const reqRealFail = await createPayoutRequest({
            sellerTenantId: tenant1,
            destinationId: dest1Id,
            amount: 1500,
            currency: 'TRY',
            userId: 'u1'
        });
        reqFailId = reqRealFail.id;

        // Remove balance before processing
        await prisma.ledgerAccount.update({ where: { id: ledger1Id }, data: { availableBalance: 900 } });

        await approvePayoutRequest({ adminUserId: adminUser, payoutRequestId: reqFailId });

        await expect(processPayoutRequestInternal({
            payoutRequestId: reqFailId, adminUserId: adminUser
        })).rejects.toThrow(/Insufficient funds/);

        const checkFail = await prisma.payoutRequest.findUnique({ where: { id: reqFailId } });
        expect(checkFail!.status).toBe('FAILED');

        // Ensure no ledgers written
        const entriesFail = await prisma.ledgerEntry.findMany({
            where: { tenantId: tenant1, referenceId: reqFailId }
        });
        expect(entriesFail.length).toBe(0);
    });

    it('6) Idempotency prevents double processing and ledger posting', async () => {
        // Try to process req1 again!
        const processed2 = await processPayoutRequestInternal({
            payoutRequestId: req1Id,
            adminUserId: adminUser
        });

        // Should return the successful result and NOT throw
        expect(processed2.status).toBe('PAID_INTERNAL');

        // Still only 4 entries
        const entries = await prisma.ledgerEntry.findMany({
            where: { tenantId: tenant1, referenceId: req1Id }
        });
        expect(entries.length).toBe(4);

        // Balance remains 900
        const l1 = await prisma.ledgerAccount.findUnique({ where: { id: ledger1Id } });
        expect(Number(l1!.availableBalance)).toBe(900);
    });

});
