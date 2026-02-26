import { PrismaClient, Prisma } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';

const prisma = new PrismaClient();

export interface ShippingInvoiceLineInput {
    trackingNo: string;
    chargeAmount: Prisma.Decimal;
    taxAmount?: Prisma.Decimal;
    serviceLevel?: string;
}

export interface IngestShippingInvoiceInput {
    carrierId: string;
    invoiceNo: string;
    periodStart?: Date;
    periodEnd?: Date;
    currency?: string;
    totalAmount: Prisma.Decimal;
    rawRef?: string;
    parsedJson?: any;
    lines: ShippingInvoiceLineInput[];
}

export async function ingestShippingInvoice(input: IngestShippingInvoiceInput) {
    const idempotencyKey = `SHIPPING_INGEST:${input.carrierId}:${input.invoiceNo}`;

    try {
        return await withIdempotency(
            prisma,
            idempotencyKey,
            'SHIPPING_INGEST',
            'PLATFORM_TENANT_CONST', // Ingestion is platform-level
            async (tx) => {
                const invoice = await tx.shippingInvoice.create({
                    data: {
                        carrierId: input.carrierId,
                        invoiceNo: input.invoiceNo,
                        periodStart: input.periodStart,
                        periodEnd: input.periodEnd,
                        currency: input.currency ?? 'TRY',
                        totalAmount: input.totalAmount,
                        rawRef: input.rawRef,
                        parsedJson: input.parsedJson || Prisma.JsonNull,
                        status: 'PARSED',
                        lines: {
                            create: input.lines.map((line) => ({
                                trackingNo: line.trackingNo,
                                chargeAmount: line.chargeAmount,
                                taxAmount: line.taxAmount,
                                serviceLevel: line.serviceLevel,
                                matchStatus: 'UNMATCHED',
                            })),
                        },
                    },
                    include: { lines: true },
                });

                return invoice;
            }
        );
    } catch (error: any) {
        if (error.message === 'ALREADY_SUCCEEDED') {
            return prisma.shippingInvoice.findUnique({
                where: {
                    carrierId_invoiceNo: {
                        carrierId: input.carrierId,
                        invoiceNo: input.invoiceNo,
                    },
                },
                include: { lines: true },
            });
        }
        throw error;
    }
}
