import { PrismaClient, Prisma } from '@prisma/client';
import { postShippingChargeback, ensureLedgerAccount } from '../../src/services/finance/shipping/postChargeback';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();
const SELLER_TEST = 'SELLER_CHARGE_CB';

describe('Shipping Chargeback Posting', () => {
    let invoiceLineId: string;
    let shipmentId: string;
    let accountId: string;

    beforeAll(async () => {
        await prisma.tenant.upsert({
            where: { id: SELLER_TEST },
            update: {},
            create: {
                id: SELLER_TEST,
                name: 'TEST TENANT',
                ownerEmail: `test-${Date.now()}@example.com`,
                status: 'ACTIVE'
            }
        });

        await prisma.company.upsert({
            where: { id: SELLER_TEST },
            update: {},
            create: {
                id: SELLER_TEST,
                tenantId: SELLER_TEST,
                name: 'TEST COMPANY',
                taxNumber: '111',
                vkn: '111'
            }
        });

        await prisma.tenant.upsert({
            where: { id: 'PLATFORM_TENANT' },
            update: {},
            create: {
                id: 'PLATFORM_TENANT',
                name: 'PLATFORM TENANT',
                ownerEmail: `platform-${Date.now()}@example.com`,
                status: 'ACTIVE'
            }
        });

        await prisma.company.upsert({
            where: { id: 'PLATFORM_TENANT' },
            update: {},
            create: {
                id: 'PLATFORM_TENANT',
                tenantId: 'PLATFORM_TENANT',
                name: 'PLATFORM COMPANY',
                taxNumber: '000',
                vkn: '000'
            }
        });

        // 1. Setup Order & Shipment & Earning
        const order = await prisma.networkOrder.create({
            data: {
                buyerCompanyId: 'BUYER_TEST',
                sellerCompanyId: SELLER_TEST,
                subtotalAmount: new Prisma.Decimal(100),
                shippingAmount: new Prisma.Decimal(10),
                commissionAmount: new Prisma.Decimal(5),
                totalAmount: new Prisma.Decimal(115),
                status: 'PAID',
                itemsHash: 'abc',
                currency: 'TRY'
            },
        });

        const shipment = await prisma.shipment.create({
            data: {
                networkOrderId: order.id,
                mode: 'MANUAL',
                carrierCode: 'FASTCARRIER',
                trackingNumber: `TRACK-CB-1-${Date.now()}`,
            }
        });
        shipmentId = shipment.id;

        await prisma.sellerEarning.create({
            data: {
                sellerCompanyId: SELLER_TEST,
                shipmentId: shipment.id,
                grossAmount: new Prisma.Decimal(100),
                commissionAmount: new Prisma.Decimal(5),
                chargebackAmount: new Prisma.Decimal(0),
                netAmount: new Prisma.Decimal(95),
                status: 'RELEASED', // So it decrements available balance
            }
        });

        // Setup seller ledger
        await prisma.$transaction(async tx => {
            const acc = await ensureLedgerAccount(tx, SELLER_TEST, 'TRY');
            await tx.ledgerAccount.update({
                where: { id: acc.id },
                data: { availableBalance: new Prisma.Decimal(1000) } // Provide balance
            });
            accountId = acc.id;
        });

        // Setup line
        const inv = await prisma.shippingInvoice.create({
            data: {
                carrierId: 'FASTCARRIER',
                invoiceNo: `INV-CB-${Date.now()}`,
                totalAmount: new Prisma.Decimal(50),
                lines: {
                    create: [
                        {
                            trackingNo: 'TRACK-CB-1',
                            chargeAmount: new Prisma.Decimal(25),
                            matchStatus: 'MATCHED',
                            sellerTenantId: SELLER_TEST,
                            shipmentId: shipment.id
                        }
                    ]
                }
            }
        });

        const lines = await prisma.shippingInvoiceLine.findMany({ where: { shippingInvoiceId: inv.id } });
        invoiceLineId = lines[0].id;

    });

    afterAll(async () => {
        await prisma.shippingInvoiceLine.deleteMany({ where: { sellerTenantId: SELLER_TEST } });
        await prisma.shippingInvoice.deleteMany({ where: { invoiceNo: { startsWith: 'INV-CB-' } } });
        await prisma.shipmentCostAllocation.deleteMany({ where: { shipmentId } });
        await prisma.ledgerEntry.deleteMany({ where: { tenantId: { in: [SELLER_TEST, 'PLATFORM_TENANT'] } } });
        await prisma.ledgerGroup.deleteMany({ where: { tenantId: { in: [SELLER_TEST, 'PLATFORM_TENANT'] } } });
        await prisma.sellerEarning.deleteMany({ where: { sellerCompanyId: SELLER_TEST } });
        await prisma.ledgerAccount.deleteMany({ where: { companyId: SELLER_TEST } });
        await prisma.shipment.deleteMany({ where: { id: shipmentId } });
        await prisma.networkOrder.deleteMany({ where: { sellerCompanyId: SELLER_TEST } });
        await prisma.company.deleteMany({ where: { id: SELLER_TEST } });
        await prisma.tenant.deleteMany({ where: { id: SELLER_TEST } });
        await prisma.idempotencyRecord.deleteMany({ where: { tenantId: SELLER_TEST } });
        await prisma.$disconnect();
    });

    it('should post chargeback exactly once and adjust balances', async () => {
        const group = await postShippingChargeback(invoiceLineId);
        expect(group).toBeDefined();

        const earning = await prisma.sellerEarning.findUnique({ where: { shipmentId } });
        expect(earning?.chargebackAmount.toNumber()).toBe(25);
        expect(earning?.netAmount.toNumber()).toBe(70); // 100 gross - 5 comm - 25 chargeback

        const line = await prisma.shippingInvoiceLine.findUnique({ where: { id: invoiceLineId } });
        expect(line?.matchStatus).toBe('RECONCILED');

        const ledger = await prisma.ledgerAccount.findUnique({ where: { companyId: SELLER_TEST } });
        expect(ledger?.availableBalance.toNumber()).toBe(975); // 1000 - 25
    });

    it('should be idempotent and not duplicate deduct', async () => {
        const group = await postShippingChargeback(invoiceLineId);
        expect(group).toBeDefined();

        const ledger = await prisma.ledgerAccount.findUnique({ where: { companyId: SELLER_TEST } });
        expect(ledger?.availableBalance.toNumber()).toBe(975); // Still 975
    });
});
