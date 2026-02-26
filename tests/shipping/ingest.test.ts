import { PrismaClient, Prisma } from '@prisma/client';
import { ingestShippingInvoice } from '../../src/services/finance/shipping/ingest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('Shipping Ingestion', () => {
    const carrierId = 'TEST_CARRIER';
    const invoiceNo = `INV-${Date.now()}`;

    beforeAll(async () => {

        await prisma.shippingInvoice.deleteMany({
            where: { carrierId, invoiceNo },
        });
        await prisma.idempotencyRecord.deleteMany({
            where: { key: `SHIPPING_INGEST:${carrierId}:${invoiceNo}` },
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should ingest invoice and lines correctly', async () => {
        const input = {
            carrierId,
            invoiceNo,
            totalAmount: new Prisma.Decimal(120),
            lines: [
                { trackingNo: 'TRACK123', chargeAmount: new Prisma.Decimal(50) },
                { trackingNo: 'TRACK456', chargeAmount: new Prisma.Decimal(70) },
            ],
        };

        const result = await ingestShippingInvoice(input);

        expect(result).toBeDefined();
        expect(result?.invoiceNo).toBe(invoiceNo);
        expect(result?.lines).toHaveLength(2);
        expect(result?.status).toBe('PARSED');
    });

    it('should be idempotent (return same record on second call)', async () => {
        const input = {
            carrierId,
            invoiceNo,
            totalAmount: new Prisma.Decimal(120),
            lines: [
                { trackingNo: 'SOMETHINGELSE', chargeAmount: new Prisma.Decimal(999) },
            ],
        };

        const result = await ingestShippingInvoice(input);
        expect(result?.lines).toHaveLength(2); // Still 2 from first ingest
    });
});
