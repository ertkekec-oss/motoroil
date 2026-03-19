import { prismaRaw as prisma } from "@/lib/prisma";

type PaidMode = "PAID" | "PAID_PENDING_APPROVAL";

export async function markOrderPaidIfEligible(opts: {
    orderId: string;
    supplierTenantId: string;
    paidMode?: PaidMode;
    paymentProvider?: string;
    paymentRef?: string;
}) {
    const paidMode = opts.paidMode ?? "PAID";

    // Only update if not already marked as paid-like.
    const updated = await prisma.order.updateMany({
        where: {
            id: opts.orderId,
            companyId: opts.supplierTenantId,
            // guard: only dealer b2b orders should be here
            salesChannel: "DEALER_B2B",
            // idempotency: do not overwrite if already paid/final
            NOT: { status: { in: ["PAID", "PAID_PENDING_APPROVAL"] } },
        },
        data: {
            status: paidMode,
        },
    });

    return { changed: updated.count === 1 };
}
