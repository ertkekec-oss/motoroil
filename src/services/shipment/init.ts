import { prisma } from '@/lib/prisma';
import { ManualCarrier } from './carriers/manual';
import { MockCarrier } from './carriers/mock';
import { CarrierAdapter } from './carriers/adapter';
import { ShipmentMode } from '@prisma/client';

export interface InitShipmentParams {
    networkOrderId: string;
    sellerCompanyId: string;
    carrierCode: string; // 'MANUAL' or 'MOCK'
    items?: any[]; // For future partial shipment support format: [{id, quantity}]
}

export async function initiateShipment(params: InitShipmentParams) {
    const { networkOrderId, sellerCompanyId, carrierCode, items } = params;

    // 1. Validate Order
    const order = await prisma.networkOrder.findUnique({
        where: { id: networkOrderId }
    });

    if (!order) {
        throw Object.assign(new Error('Order not found'), { httpCode: 404 });
    }

    if (order.sellerCompanyId !== sellerCompanyId) {
        throw Object.assign(new Error('Unauthorized: Only seller can initiate shipment'), { httpCode: 403 });
    }

    if (order.status !== 'PAID') {
        throw Object.assign(new Error(`Cannot ship order in ${order.status} state. Must be PAID.`), { httpCode: 400 });
    }


    // 2. Select Adapter
    let carrier: CarrierAdapter;
    let mode: ShipmentMode = 'INTEGRATED';

    if (carrierCode === 'MANUAL') {
        carrier = new ManualCarrier();
        mode = 'MANUAL';
    } else if (carrierCode === 'MOCK') {
        carrier = new MockCarrier();
    } else {
        throw Object.assign(new Error(`Unknown carrier: ${carrierCode}`), { httpCode: 400 });
    }

    // items sent (full items for now if not overridden by partial implementation input)
    let baseItems = items;
    if (!baseItems && order.items && Array.isArray(order.items)) {
        baseItems = order.items;
    }
    const normalizedItems = (baseItems || []).map((i: any) => ({
        productId: i.productId || i.id,
        qty: Number(i.quantity || i.qty || 1)
    }));

    // 3. Initiate tracking details logically from provider
    const shipmentResult = await carrier.createShipment({
        orderId: order.id,
        buyerCompanyId: order.buyerCompanyId,
        sellerCompanyId: order.sellerCompanyId,
        items: normalizedItems,
    });

    // 4. Wrap database inserts (Shipment, StockMovement trigger) in Transaction
    const shipment = await prisma.$transaction(async (tx) => {
        const last = await tx.shipment.findFirst({
            where: { networkOrderId },
            orderBy: { sequence: 'desc' }
        });

        const nextSequence = (last?.sequence || 0) + 1;
        const initKey = `${networkOrderId}:${nextSequence}`;

        let shp;
        try {
            // a. Create internal shipment record
            shp = await tx.shipment.create({
                data: {
                    networkOrderId,
                    mode,
                    status: 'LABEL_CREATED',
                    carrierCode,
                    trackingNumber: shipmentResult.trackingNumber,
                    labelUrl: shipmentResult.labelUrl,
                    items: normalizedItems,
                    sequence: nextSequence,
                    initKey
                }
            });
        } catch (e: any) {
            if (e.code === 'P2002') {
                const existingShp = await tx.shipment.findUnique({
                    where: { initKey }
                });
                if (existingShp) return existingShp;
            }
            throw e;
        }

        // b. Trigger stock movement (OUT) as goods represent shipped physical movement
        // Because a networkOrder has an array of items (like { id, quantity }), we subtract each from stock
        // Assuming your items schema has a standard structure where sku or productId correlates strictly
        // We iterate and create OUT movements attached to the context
        if (Array.isArray(normalizedItems)) {
            for (const item of normalizedItems) {
                // Sku/ProductId availability varies in items object struct. Assuming standardized network order representation
                const productId = item.productId;
                const quantity = item.qty;

                if (productId) {
                    await tx.stockMovement.create({
                        data: {
                            productId,
                            companyId: sellerCompanyId,
                            type: 'OUT',
                            quantity: Number(quantity),
                            referenceId: shp.id, // Links via string
                            idempotencyKey: `${shp.id}:${productId}`, // Shield against double deduct
                            description: `Shipment ${shp.trackingNumber || shp.id} for Order ${order.id}`,
                            date: new Date()
                        }
                    });
                }
            }
        }

        // c. Log initial Event locally
        await tx.shipmentEvent.create({
            data: {
                shipmentId: shp.id,
                status: 'LABEL_CREATED',
                description: `Shipment created via ${carrierCode}`
            }
        });

        // d. Update the NetworkOrder Status so its tracking is moving
        // Wait! We usually set 'SHIPPED' after we know the label was manifested or in webhook
        // For partial shipments we may not flag everything as SHIPPED fully yet, let's leave it as PAID or PARTIAL
        // It stays PAID, we move order status to SHIPPED upon all items processed or generic approach
        // Right now MVP sets it to processing or partial. Let's not mutate order generic status yet here, webhook takes care of IN_TRANSIT -> SHIPPED.

        return shp;
    });

    // 5. Trigger Nilvera e-Irsaliye (E-Waybill) Draft asynchronously conceptually
    // In production you would import NilveraWaybillService here and kick it off asynchronously.
    console.log(`[Nilvera Integration] Mock enqueue: Generating e-waybill draft for shipment ${shipment.id}`);

    return shipment;
}
