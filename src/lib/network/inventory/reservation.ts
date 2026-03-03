import prisma from "@/lib/prisma";

type SnapshotItem = {
    productId?: string;
    id?: string; // bazı sistemlerde productId yerine id kullanılabiliyor
    quantity: number;
};

function getPid(i: SnapshotItem) {
    return (i.productId ?? i.id) as string;
}

/**
 * Releases reservedStock for an order items snapshot.
 * Safe to call multiple times if you keep an order-level guard.
 */
export async function releaseReservationForOrder(opts: {
    orderId: string;
    supplierTenantId: string;
}) {
    return prisma.$transaction(async (tx) => {
        // Order lock + ensure belongs to tenant
        const order = await tx.order.findFirst({
            where: {
                id: opts.orderId,
                companyId: opts.supplierTenantId,
                salesChannel: "DEALER_B2B",
            },
            select: {
                id: true,
                status: true,
                items: true,
                reservationReleasedAt: true, // idempotency
            },
        });

        if (!order) throw new Error("ORDER_NOT_FOUND");

        // Optional idempotency: if already released, no-op
        if (order.reservationReleasedAt) return { released: false };

        const items = (order.items as any[]) ?? [];
        for (const it of items) {
            const productId = getPid(it);
            const qty = Number(it.quantity ?? 0);
            if (!productId || qty <= 0) continue;

            // decrement reservedStock but never below 0
            await tx.product.updateMany({
                where: { id: productId, reservedStock: { gte: qty } },
                data: { reservedStock: { decrement: qty } },
            });
        }

        await tx.order.update({
            where: { id: order.id },
            data: { reservationReleasedAt: new Date() },
        });

        return { released: true };
    });
}
