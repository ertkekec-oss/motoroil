import { PrismaClient, Prisma } from '@prisma/client';
import { reconcileShippingInvoice } from '../../src/services/finance/shipping/reconcile';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('Shipping Reconciliation', () => {
    let invoiceId: string;
    let shipmentIdFullMatch: string;

    beforeAll(async () => {
        // 1. Create a Network Order + Shipment
        const order = await prisma.networkOrder.create({
            data: {
                buyerCompanyId: 'BUYER_TEST',
                sellerCompanyId: 'SELLER_TEST',
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
                trackingNumber: 'TRACK-MATCH-1',
            }
        });
        shipmentIdFullMatch = shipment.id;

        // 2. Create the invoice
        const invoice = await prisma.shippingInvoice.create({
            data: {
                carrierId: 'FASTCARRIER',
                invoiceNo: `REC-INV-${Date.now()}`,
                totalAmount: new Prisma.Decimal(50),
                lines: {
                    create: [
                        { trackingNo: 'TRACK-MATCH-1', chargeAmount: new Prisma.Decimal(25), matchStatus: 'UNMATCHED' },
                        { trackingNo: 'TRACK-NORM.1', chargeAmount: new Prisma.Decimal(25), matchStatus: 'UNMATCHED' }, // Should fail if normalization is not properly matching db or db expects normal
                        { trackingNo: 'NONEXISTENT', chargeAmount: new Prisma.Decimal(10), matchStatus: 'UNMATCHED' }
                    ]
                }
            }
        });

        invoiceId = invoice.id;
    });

    afterAll(async () => {
        await prisma.shippingInvoice.delete({ where: { id: invoiceId } });
        await prisma.shipment.delete({ where: { id: shipmentIdFullMatch } });
        await prisma.$disconnect();
    });

    it('should reconcile and identify MATCHED lines', async () => {
        const results = await reconcileShippingInvoice(invoiceId);

        expect(results).toBeDefined();
        expect(results.matchedCount).toBeGreaterThanOrEqual(1);

        const invoice = await prisma.shippingInvoice.findUnique({
            where: { id: invoiceId },
            include: { lines: true }
        });

        const matchedLine = invoice?.lines.find(l => l.trackingNo === 'TRACK-MATCH-1');
        expect(matchedLine?.matchStatus).toBe('MATCHED');
        expect(matchedLine?.matchReason).toBe('EXACT_MATCH');
        expect(matchedLine?.shipmentId).toBe(shipmentIdFullMatch);
        expect(matchedLine?.sellerTenantId).toBe('SELLER_TEST');
    });
});
