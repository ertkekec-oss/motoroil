import { prismaRaw as prisma } from "@/lib/prisma";
import { getAccountingAdapter } from "./getAdapter";
import { auditLog } from "@/lib/audit/log";

type TriggerAccountingOpts = {
    tenantId: string;
    actorUserId?: string;
    actorDealerUserId?: string;
    action: "ORDER_CREATED" | "PAYMENT_SUCCEEDED" | "REFUND_SUCCEEDED";
    entityId: string; // orderId, intentId, or refundId
};

export async function triggerAccountingPost(opts: TriggerAccountingOpts) {
    try {
        const adapter = getAccountingAdapter();

        await auditLog({
            tenantId: opts.tenantId,
            actorUserId: opts.actorUserId,
            actorDealerUserId: opts.actorDealerUserId,
            type: "ACCOUNTING_POST_ATTEMPT",
            entityType: "AccountingHook",
            entityId: opts.entityId,
            meta: { action: opts.action },
        });

        if (opts.action === "ORDER_CREATED") {
            const order = await prisma.order.findUnique({
                where: { id: opts.entityId },
                select: { id: true, accountingPostedAt: true }
            });
            if (!order || order.accountingPostedAt) return; // already posted
            await adapter.postOrder(opts.entityId);
            await prisma.order.update({ where: { id: order.id }, data: { accountingPostedAt: new Date() } });
        }
        else if (opts.action === "PAYMENT_SUCCEEDED") {
            const intent = await prisma.dealerPaymentIntent.findUnique({
                where: { id: opts.entityId },
                select: { id: true, accountingPostedAt: true }
            });
            if (!intent || intent.accountingPostedAt) return; // already posted
            await adapter.postPayment(opts.entityId);
            await prisma.dealerPaymentIntent.update({ where: { id: intent.id }, data: { accountingPostedAt: new Date() } });
        }
        else if (opts.action === "REFUND_SUCCEEDED") {
            const refund = await prisma.dealerRefund.findUnique({
                where: { id: opts.entityId },
                select: { id: true, accountingPostedAt: true }
            });
            if (!refund || refund.accountingPostedAt) return; // already posted
            await adapter.postRefund(opts.entityId);
            await prisma.dealerRefund.update({ where: { id: refund.id }, data: { accountingPostedAt: new Date() } });
        }

        await auditLog({
            tenantId: opts.tenantId,
            actorUserId: opts.actorUserId,
            actorDealerUserId: opts.actorDealerUserId,
            type: "ACCOUNTING_POST_SUCCEEDED",
            entityType: "AccountingHook",
            entityId: opts.entityId,
            meta: { action: opts.action },
        });

    } catch (error: any) {
        await auditLog({
            tenantId: opts.tenantId,
            actorUserId: opts.actorUserId,
            actorDealerUserId: opts.actorDealerUserId,
            type: "ACCOUNTING_POST_FAILED",
            entityType: "AccountingHook",
            entityId: opts.entityId,
            meta: { action: opts.action, error: error?.message },
        });
        // Fail-open: log console for debugging, don't crash the request
        console.error("[ACCOUNTING HOOK FAILED]", error);
    }
}
