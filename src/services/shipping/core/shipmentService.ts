import prisma from '@/lib/prisma';
import { NetworkShipmentStatus, NetworkShipmentDirection, NetworkShipmentType } from '@prisma/client';

export interface CreateDraftShipmentInput {
    tenantId: string;
    orderId?: string;
    sellerTenantId?: string;
    buyerTenantId?: string;
    carrierCode: string;
    shipmentDirection?: NetworkShipmentDirection;
    shipmentType?: NetworkShipmentType;
    totalPackages?: number;
}

export async function createDraftShipment(input: CreateDraftShipmentInput) {
    const shipment = await prisma.networkShipment.create({
        data: {
            tenantId: input.tenantId,
            orderId: input.orderId,
            sellerTenantId: input.sellerTenantId,
            buyerTenantId: input.buyerTenantId,
            carrierCode: input.carrierCode,
            status: 'DRAFT',
            shipmentDirection: input.shipmentDirection || 'OUTBOUND',
            shipmentType: input.shipmentType || 'STANDARD',
            totalPackages: input.totalPackages || 1
        }
    });

    // Create initial packages
    await Promise.all(
        Array.from({ length: shipment.totalPackages }).map((_, index) =>
            prisma.networkShipmentPackage.create({
                data: {
                    shipmentId: shipment.id,
                    packageNo: index + 1,
                    status: 'PENDING'
                }
            })
        )
    );

    return shipment;
}

export async function attachShipmentItems(shipmentId: string, items: { orderItemId: string, productId?: string, quantity: number }[]) {
    const shipment = await prisma.networkShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new Error('Shipment not found');

    if (shipment.status !== 'DRAFT') {
        throw new Error('Can only attach items to DRAFT shipment');
    }

    const createdItems = await Promise.all(
        items.map(item =>
            prisma.networkShipmentItem.create({
                data: {
                    shipmentId,
                    orderItemId: item.orderItemId,
                    productId: item.productId,
                    quantity: item.quantity
                }
            })
        )
    );

    return createdItems;
}

export async function listShipmentsForTenant(tenantId: string, filters: any = {}) {
    return prisma.networkShipment.findMany({
        where: { tenantId, ...filters },
        include: { packages: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getShipmentDetails(tenantId: string, shipmentId: string) {
    const shipment = await prisma.networkShipment.findUnique({
        where: { id: shipmentId },
        include: {
            packages: true,
            items: true,
            trackingEvents: { orderBy: { eventTime: 'desc' } },
            labelRequests: true
        }
    });

    if (!shipment || shipment.tenantId !== tenantId) throw new Error('Not found or access denied');
    return shipment;
}

export async function cancelShipment(tenantId: string, shipmentId: string) {
    const shipment = await prisma.networkShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment || shipment.tenantId !== tenantId) throw new Error('Not found or access denied');

    if (shipment.status === 'DELIVERED' || shipment.status === 'CANCELED') {
        throw new Error('Cannot cancel shipment in current state');
    }

    // Call adapter cancel (skip error if not created yet)

    return prisma.networkShipment.update({
        where: { id: shipmentId },
        data: {
            status: 'CANCELED',
            canceledAt: new Date()
        }
    });
}
