import { NetworkShipmentStatus } from '@prisma/client';

export function projectShipmentForTenant(shipment: any) {
    if (!shipment) return null;

    const shortTimeline = shipment.trackingEvents
        ? shipment.trackingEvents.slice(0, 3).map((e: any) => ({
            status: e.normalizedStatus,
            description: e.description,
            time: e.eventTime,
            location: e.locationText
        }))
        : [];

    return {
        id: shipment.id,
        orderId: shipment.orderId,
        carrierCode: shipment.carrierCode,
        status: shipment.status,
        direction: shipment.shipmentDirection,
        totalPackages: shipment.totalPackages,
        trackingNumber: shipment.trackingNumber || null,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
        createdAt: shipment.createdAt,
        timelineSummary: shortTimeline,
        packages: shipment.packages?.map((p: any) => ({
            packageNo: p.packageNo,
            status: p.status,
            barcode: p.barcode
        }))
    };
}
