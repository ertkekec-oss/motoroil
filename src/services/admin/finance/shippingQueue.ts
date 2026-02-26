import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to mask handles/emails if present in the model or returned data
function redactPII(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => redactPII(item));
    }

    const redacted = { ...obj };
    const piiKeys = ['email', 'phone', 'address', 'taxNumber', 'vkn']; // Basic string matches
    for (const key of Object.keys(redacted)) {
        if (piiKeys.includes(key) && redacted[key]) {
            const val = redacted[key];
            if (typeof val === 'string' && val.length > 4) {
                redacted[key] = `${val.substring(0, 2)}***${val.substring(val.length - 2)}`;
            } else {
                redacted[key] = '***';
            }
        }
        if (typeof redacted[key] === 'object') {
            redacted[key] = redactPII(redacted[key]); // Recurse
        }
    }
    return redacted;
}

export async function getShippingInvoices(status?: string, cursor?: string, take: number = 20) {
    const where = status ? { status: status as any } : {};

    const invoices = await prisma.shippingInvoice.findMany({
        where,
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' }
    });

    let nextCursor: string | undefined = undefined;
    if (invoices.length > take) {
        const nextItem = invoices.pop();
        nextCursor = nextItem?.id;
    }

    return {
        data: invoices, // Invoices themselves don't typically carry much PII, but usually just carrierId, invoiceNo
        nextCursor
    };
}

export async function getShippingInvoiceById(id: string) {
    const invoice = await prisma.shippingInvoice.findUnique({
        where: { id },
        include: {
            lines: {
                include: {
                    shipment: {
                        include: {
                            order: {
                                select: {
                                    id: true,
                                    buyerCompanyId: true,
                                    sellerCompanyId: true,
                                    status: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!invoice) return null;

    // Redact
    return redactPII(invoice);
}

export async function getShippingLinesQueue(statusFilter: string, cursor?: string, take: number = 50) {
    const statuses = statusFilter.split(',').filter(s => s.trim().length > 0);
    const where = statuses.length > 0 ? { matchStatus: { in: statuses as any } } : {};

    const lines = await prisma.shippingInvoiceLine.findMany({
        where,
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
            invoice: { select: { invoiceNo: true, status: true } }
        }
    });

    let nextCursor: string | undefined = undefined;
    if (lines.length > take) {
        const nextItem = lines.pop();
        nextCursor = nextItem?.id;
    }

    return {
        data: redactPII(lines),
        nextCursor
    };
}
