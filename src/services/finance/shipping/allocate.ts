import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function allocateShipmentShippingCost(
    shipmentId: string,
    amount: Prisma.Decimal,
    shippingInvoiceLineId?: string
) {
    // Use unique constraint to find existing or create.
    // The constraint is @@unique([shipmentId, shippingInvoiceLineId]).

    // Since shippingInvoiceLineId can be optional or null (though unique constraint might need unique non-nulls, Prisma null unique is tricky. Let's assume the user schema makes it unique safely).

    const existing = await prisma.shipmentCostAllocation.findFirst({
        where: {
            shipmentId,
            shippingInvoiceLineId: shippingInvoiceLineId || null,
        },
    });

    if (existing) {
        return existing; // idempotency: no-op if already exists
    }

    return await prisma.shipmentCostAllocation.create({
        data: {
            shipmentId,
            shippingInvoiceLineId,
            model: 'CHARGEBACK_SELLER',
            sellerShareAmount: amount,
            platformShareAmount: new Prisma.Decimal(0),
            buyerShareAmount: new Prisma.Decimal(0),
        },
    });
}
