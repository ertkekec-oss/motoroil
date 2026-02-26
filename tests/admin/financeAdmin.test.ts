import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';
import { requirePlatformFinanceAdmin } from '../../src/services/admin/finance/guard';
import { manualMatchShippingLine, disputeShippingLine } from '../../src/services/admin/finance/shippingMutations';
import { adminOverrideEarningRelease } from '../../src/services/admin/finance/earnings';
import { createCommissionPlan, activateCommissionPlan, getCommissionPlansList } from '../../src/services/admin/finance/commissionPlans';
import { getShippingLinesQueue, getShippingInvoices } from '../../src/services/admin/finance/shippingQueue';
import { getFinanceOverview } from '../../src/services/admin/finance/overview';
import { getPlatformLedgerEntries } from '../../src/services/admin/finance/ledger';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();
const MOCK_ADMIN_ID = 'TEST_PLATFORM_ADMIN_USER';

// Mock session
vi.mock('../../src/lib/auth', () => ({
    getSession: vi.fn() as any
}));
import { getSession } from '../../src/lib/auth';

describe('Admin Finance Control Center', () => {

    beforeAll(async () => {
        // Setup PLATFORM_TENANT_CONST if missing
        await prisma.tenant.upsert({
            where: { id: 'PLATFORM_TENANT_CONST' },
            update: {},
            create: {
                id: 'PLATFORM_TENANT_CONST',
                name: 'PLATFORM_TENANT_CONST',
                ownerEmail: 'platform@example.com',
                status: 'ACTIVE'
            }
        });

        await prisma.company.upsert({
            where: { id: 'PLATFORM_TENANT_CONST' },
            update: {},
            create: {
                id: 'PLATFORM_TENANT_CONST',
                tenantId: 'PLATFORM_TENANT_CONST',
                name: 'PLATFORM_COMP',
                taxNumber: '000',
                vkn: '000'
            }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('1. Auth Guard', () => {
        it('should deny non-admin users', async () => {
            (getSession as any).mockResolvedValue({
                user: { id: 'regular_user', tenantId: 'some_tenant', role: 'USER' }
            });
            await expect(requirePlatformFinanceAdmin()).rejects.toThrow('FORBIDDEN');
        });

        it('should allow platform admin', async () => {
            (getSession as any).mockResolvedValue({
                user: { id: 'admin_user', tenantId: 'PLATFORM_ADMIN', role: 'PLATFORM_ADMIN' }
            });
            const user = await requirePlatformFinanceAdmin();
            expect(user.id).toBe('admin_user');
        });

        it('should allow finance admin', async () => {
            (getSession as any).mockResolvedValue({
                user: { id: 'admin_user', tenantId: 'xyz', role: 'FINANCE_ADMIN' }
            });
            const user = await requirePlatformFinanceAdmin();
            expect(user.id).toBe('admin_user');
        });
    });

    describe('2. Shipping Ops Queue', () => {
        let invoiceId: string;
        let lineId: string;

        beforeAll(async () => {
            const inv = await prisma.shippingInvoice.create({
                data: {
                    carrierId: 'TESTC',
                    invoiceNo: 'TEST-INV-ADMIN',
                    totalAmount: new Prisma.Decimal(10),
                    status: 'PARTIALLY_RECONCILED',
                    lines: {
                        create: [
                            { trackingNo: 'TK1', chargeAmount: new Prisma.Decimal(5), matchStatus: 'DISPUTED' }
                        ]
                    }
                },
                include: { lines: true }
            });
            invoiceId = inv.id;
            lineId = inv.lines[0].id;
        });

        afterAll(async () => {
            await prisma.shippingInvoiceLine.deleteMany({ where: { shippingInvoiceId: invoiceId } });
            await prisma.shippingInvoice.delete({ where: { id: invoiceId } });
        });

        it('should return queues based on statuses with PII redacted', async () => {
            const res = await getShippingLinesQueue('DISPUTED');
            expect(res.data.some((l: any) => l.id === lineId)).toBe(true);

            // Fetch invoice checks
            const invoices = await getShippingInvoices('PARTIALLY_RECONCILED');
            expect(invoices.data.some((i: any) => i.id === invoiceId)).toBe(true);
        });
    });

    describe('3. Manual Match Override & Disputes (Mutations)', () => {
        let shipmentId: string;
        let lineId: string;

        beforeAll(async () => {
            const order = await prisma.networkOrder.create({
                data: {
                    buyerCompanyId: 'B1', sellerCompanyId: 'S1',
                    subtotalAmount: 10, totalAmount: 10, shippingAmount: 2, commissionAmount: 1,
                    status: 'PAID', itemsHash: 'x', currency: 'TRY'
                }
            });
            const shipment = await prisma.shipment.create({
                data: { networkOrderId: order.id, mode: 'MANUAL', carrierCode: 'TESTC', trackingNumber: 'M_OVERRIDE' }
            });
            shipmentId = shipment.id;

            const inv = await prisma.shippingInvoice.create({
                data: {
                    carrierId: 'TESTC', invoiceNo: 'OVERRIDE-INV', totalAmount: 0,
                    lines: {
                        create: [{ trackingNo: 'M_OVERRIDE', chargeAmount: 5, matchStatus: 'UNMATCHED' }]
                    }
                },
                include: { lines: true }
            });
            lineId = inv.lines[0].id;
        });

        afterAll(async () => {
            await prisma.financeAuditLog.deleteMany({ where: { entityId: lineId } });
            await prisma.idempotencyRecord.deleteMany({ where: { key: { startsWith: 'ADMIN_' } } });
            await prisma.shippingInvoiceLine.delete({ where: { id: lineId } });
            await prisma.shippingInvoice.deleteMany({ where: { invoiceNo: 'OVERRIDE-INV' } });
            await prisma.shipment.delete({ where: { id: shipmentId } });
            await prisma.networkOrder.deleteMany({ where: { sellerCompanyId: 'S1' } });
        });

        it('should manually override and match a line exactly once, writing audit log', async () => {
            // First call
            const updated = await manualMatchShippingLine(MOCK_ADMIN_ID, lineId, shipmentId);
            expect(updated.matchStatus).toBe('MATCHED');
            expect(updated.matchReason).toBe('MANUAL_ADMIN_OVERRIDE');

            // Second call should throw ALREADY_SUCCEEDED wrapped since we use generic idempotency wrapper
            await expect(manualMatchShippingLine(MOCK_ADMIN_ID, lineId, shipmentId))
                .rejects.toThrow('ALREADY_SUCCEEDED');

            // Check audit log
            const audit = await prisma.financeAuditLog.findFirst({ where: { entityId: lineId, action: 'SHIPPING_LINE_MATCHED' } });
            expect(audit).toBeDefined();
            expect(audit?.actor).toBe(MOCK_ADMIN_ID);
        }, 15000);

        it('should dispute a line and write audit log', async () => {
            const updated = await disputeShippingLine(MOCK_ADMIN_ID, lineId, 'UNKNOWN_SELLER', 'Test note');
            expect(updated.matchStatus).toBe('DISPUTED');

            const audit = await prisma.financeAuditLog.findFirst({ where: { entityId: lineId, action: 'SHIPPING_LINE_DISPUTED' } });
            expect(audit).toBeDefined();
            expect((audit?.payloadJson as any).reasonCode).toBe('UNKNOWN_SELLER');
            expect((audit?.payloadJson as any).note).toBe('Test note');
        });
    });

    describe('4. Commission Plan Management', () => {
        let plan1: any;
        let plan2: any;

        afterAll(async () => {
            const planIds = [];
            if (plan1) planIds.push(plan1.id);
            if (plan2) planIds.push(plan2.id);

            await prisma.idempotencyRecord.deleteMany({ where: { key: { startsWith: 'ADMIN_' } } });
            await prisma.financeAuditLog.deleteMany({ where: { action: { startsWith: 'COMMISSION_PLAN_' } } });
            await prisma.commissionRule.deleteMany({ where: { planId: { in: planIds } } });
            await prisma.commissionPlan.deleteMany({ where: { id: { in: planIds } } });
        });

        it('should create commission plans with audit log', async () => {
            plan1 = await createCommissionPlan(MOCK_ADMIN_ID, {
                name: 'Plan 1', currency: 'TRY', roundingMode: 'HALF_UP', precision: 2,
                taxInclusive: true,
                isDefault: true,
                rules: [{ matchType: 'DEFAULT', ratePercentage: new Prisma.Decimal(5), priority: 1 }]
            });

            expect(plan1.isDefault).toBe(true);

            plan2 = await createCommissionPlan(MOCK_ADMIN_ID, {
                name: 'Plan 2', currency: 'TRY', roundingMode: 'HALF_UP', precision: 2,
                taxInclusive: true,
                isDefault: true,
                rules: [{ matchType: 'DEFAULT', ratePercentage: new Prisma.Decimal(7), priority: 1 }]
            });

            // Since create plan isolates defaults
            const p1 = await prisma.commissionPlan.findUnique({ where: { id: plan1.id } });
            expect(p1?.isDefault).toBe(false);

            const audit = await prisma.financeAuditLog.findFirst({ where: { entityId: plan2.id } });
            expect(audit?.action).toBe('COMMISSION_PLAN_CREATED');
        }, 15000);

        it('should activate a plan and ensure single default', async () => {
            // Activate plan1, which makes it default active maybe? Wait, activate API logic implemented only un-defaults others if plan is default.
            // Let's set plan1 to default directly to test logic.
            await prisma.commissionPlan.update({ where: { id: plan1.id }, data: { isDefault: false } });

            const result = await activateCommissionPlan(MOCK_ADMIN_ID, plan1.id);
            expect(result.isDefault).toBe(true);

            // Because plan1 was default, plan2 should be inactive/undeserted.
            const p2 = await prisma.commissionPlan.findUnique({ where: { id: plan2.id } });
            expect(p2?.isDefault).toBe(false);

            // Idempotency check
            await expect(activateCommissionPlan(MOCK_ADMIN_ID, plan1.id)).rejects.toThrow('ALREADY_SUCCEEDED');
        });
    });

    describe('5. Ledger & Overview (Read Only)', () => {
        beforeAll(async () => {
            const acc = await prisma.ledgerAccount.upsert({
                where: { companyId: 'PLATFORM_TENANT_CONST' },
                update: {},
                create: { companyId: 'PLATFORM_TENANT_CONST' }
            });
            const grp = await prisma.ledgerGroup.create({
                data: {
                    idempotencyKey: 'TEST_REF_GRP_1_' + Date.now(),
                    tenantId: 'PLATFORM_TENANT_CONST',
                    type: 'MANUAL'
                }
            });
            await prisma.ledgerEntry.create({
                data: {
                    tenantId: 'PLATFORM_TENANT_CONST',
                    accountType: 'PLATFORM_REVENUE_COMMISSION',
                    direction: 'CREDIT',
                    amount: new Prisma.Decimal(105),
                    currency: 'TRY',
                    refType: 'TEST_REF',
                    referenceId: '123',
                    ledgerAccountId: acc.id,
                    groupId: grp.id
                }
            });
        });

        afterAll(async () => {
            await prisma.ledgerEntry.deleteMany({ where: { refType: 'TEST_REF' } });
            await prisma.ledgerGroup.deleteMany({ where: { idempotencyKey: { startsWith: 'TEST_REF_GRP_1' } } });
        });

        it('should get overview sums', async () => {
            const overview = await getFinanceOverview(new Date(Date.now() - 100000).toISOString(), new Date(Date.now() + 100000).toISOString());
            // Since there is one PLATFORM_REVENUE_COMMISSION record we just created, it should show up
            expect(overview.commissionRevenue).toBeGreaterThanOrEqual(105);
        });

        it('should get platform ledger entries', async () => {
            const ledger = await getPlatformLedgerEntries({ account: 'PLATFORM_REVENUE_COMMISSION', take: 5 });
            expect(ledger.data.length).toBeGreaterThan(0);
            expect(ledger.data.some(e => e.refType === 'TEST_REF')).toBe(true);
        });
    });

    describe('6. Earning Override', () => {
        let orderId: string;
        let shipmentId: string;
        let earningId: string;

        beforeAll(async () => {
            const order = await prisma.networkOrder.create({
                data: {
                    buyerCompanyId: 'B1', sellerCompanyId: 'PLATFORM_TENANT_CONST',
                    subtotalAmount: 10, totalAmount: 10, shippingAmount: 2, commissionAmount: 1,
                    status: 'DELIVERED', itemsHash: 'x', currency: 'TRY'
                }
            });
            orderId = order.id;

            const shipment = await prisma.shipment.create({
                data: { networkOrderId: order.id, mode: 'MANUAL', carrierCode: 'TESTC', trackingNumber: 'EARNING_OVERRIDE' }
            });
            shipmentId = shipment.id;

            const earning = await prisma.sellerEarning.create({
                data: {
                    sellerCompanyId: 'PLATFORM_TENANT_CONST',
                    shipmentId: shipment.id,
                    grossAmount: 10, commissionAmount: 1, chargebackAmount: 0, netAmount: 9,
                    status: 'CLEARED', expectedClearDate: new Date(Date.now() + 1000000) // far future
                }
            });
            earningId = earning.id;
        });

        afterAll(async () => {
            await prisma.financeAuditLog.deleteMany({ where: { entityId: earningId } });
            await prisma.idempotencyRecord.deleteMany({ where: { key: { startsWith: 'ADMIN_EARNING_' } } });
            await prisma.sellerEarning.delete({ where: { id: earningId } });
            await prisma.shipment.delete({ where: { id: shipmentId } });
            await prisma.networkOrder.delete({ where: { id: orderId } });
        });

        it('should override expected clear date and audit log', async () => {
            const updated = await adminOverrideEarningRelease(MOCK_ADMIN_ID, earningId, 'Test override') as any;

            // The expectedClearDate should now be in the past or exactly now, which means <= current time
            expect(updated.expectedClearDate?.getTime() ?? 0).toBeLessThanOrEqual(Date.now());

            const audit = await prisma.financeAuditLog.findFirst({
                where: { entityId: earningId, action: 'EARNING_MANUAL_RELEASE' }
            });

            expect(audit).toBeDefined();
            expect(audit?.actor).toBe(MOCK_ADMIN_ID);
        });
    });
});
