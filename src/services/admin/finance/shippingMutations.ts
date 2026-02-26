import { PrismaClient, Prisma } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';
import { createFinanceAuditLog } from './audit';
// If postChargeback exposes allocation or posting functions, we'd import them here.
// For now, we will perform the direct mutation and leave logic flow for worker if needed, 
// or implement the full flow inside the transaction.

const prisma = new PrismaClient();

export async function manualMatchShippingLine(
    adminUserId: string,
    lineId: string,
    shipmentId: string
) {
    const key = `ADMIN_MATCH_LINE:${lineId}:${shipmentId}`;

    return await withIdempotency(prisma, key, 'SHIPPING_ADMIN_OPS', 'PLATFORM_TENANT_CONST', async (tx) => {
        // 1. Validate line and shipment
        const line = await tx.shippingInvoiceLine.findUnique({ where: { id: lineId } });
        if (!line) throw new Error('Line not found');
        if (line.matchStatus === 'RECONCILED' || line.matchStatus === 'DISPUTED') {
            throw new Error(`Cannot manually match a line in status ${line.matchStatus}`);
        }

        const shipment = await tx.shipment.findUnique({
            where: { id: shipmentId },
            include: { order: true }
        });
        if (!shipment) throw new Error('Shipment not found');

        // 2. Set MATCHED
        const updated = await tx.shippingInvoiceLine.update({
            where: { id: lineId },
            data: {
                matchStatus: 'MATCHED',
                shipmentId: shipment.id,
                sellerTenantId: shipment.order.sellerCompanyId,
                matchReason: 'MANUAL_ADMIN_OVERRIDE'
            }
        });

        // 3. Write audit log
        await createFinanceAuditLog(
            tx,
            'SHIPPING_LINE_MATCHED',
            adminUserId,
            lineId,
            'ShippingInvoiceLine', // entity type
            { oldStatus: line.matchStatus, newStatus: 'MATCHED', shipmentId }
        );

        // Note: The actual allocation/chargeback posting logic would usually be triggered by the reconciliation worker
        // running over MATCHED lines or called directly here if we had the service functions isolated.
        // Assuming Phase 4 `postShippingChargeback(lineId)` could be called asynchronously out-of-band or here.

        return updated;
    });
}

export async function disputeShippingLine(
    adminUserId: string,
    lineId: string,
    reasonCode: string,
    note?: string
) {
    const key = `ADMIN_DISPUTE_LINE:${lineId}:${Date.now()}`; // Allows multiple subsequent dispute updates realistically, 
    // or if we enforce exactly-once dispute creation, we drop the Date

    return await withIdempotency(prisma, key, 'SHIPPING_ADMIN_OPS', 'PLATFORM_TENANT_CONST', async (tx) => {
        const line = await tx.shippingInvoiceLine.findUnique({ where: { id: lineId } });
        if (!line) throw new Error('Line not found');

        const updated = await tx.shippingInvoiceLine.update({
            where: { id: lineId },
            data: {
                matchStatus: 'DISPUTED',
                // Maybe a custom string field or JSON if schema supports notes, currently it's just state mutation
            }
        });

        await createFinanceAuditLog(
            tx,
            'SHIPPING_LINE_DISPUTED',
            adminUserId,
            lineId,
            'ShippingInvoiceLine',
            { reasonCode, note, priorStatus: line.matchStatus }
        );

        return updated;
    });
}
