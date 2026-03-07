export function projectShipmentForAdmin(shipment: any) {
    if (!shipment) return null;

    return {
        id: shipment.id,
        tenantId: shipment.tenantId,
        orderId: shipment.orderId,
        sellerTenantId: shipment.sellerTenantId,
        buyerTenantId: shipment.buyerTenantId,
        carrierCode: shipment.carrierCode,
        externalShipmentId: shipment.externalShipmentId,
        trackingNumber: shipment.trackingNumber,
        labelFileKey: shipment.labelFileKey,
        status: shipment.status,
        shipmentDirection: shipment.shipmentDirection,
        shipmentType: shipment.shipmentType,
        totalPackages: shipment.totalPackages,
        currency: shipment.currency,
        shippingCost: shipment.shippingCost,
        shippedAt: shipment.shippedAt,
        pickedUpAt: shipment.pickedUpAt,
        deliveredAt: shipment.deliveredAt,
        canceledAt: shipment.canceledAt,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,

        packages: shipment.packages,
        items: shipment.items,

        // Includes full tracking timeline with raw payloads for debug
        trackingEvents: shipment.trackingEvents?.map((e: any) => ({
            id: e.id,
            externalEventId: e.externalEventId,
            carrierEventCode: e.carrierEventCode,
            normalizedStatus: e.normalizedStatus,
            locationText: e.locationText,
            description: e.description,
            eventTime: e.eventTime,
            processedAt: e.processedAt,
            rawPayload: e.rawPayload
        })),

        // Include label request audit logs
        labelRequests: shipment.labelRequests?.map((r: any) => ({
            id: r.id,
            requestStatus: r.requestStatus,
            requestPayloadHash: r.requestPayloadHash,
            responsePayloadHash: r.responsePayloadHash,
            errorCode: r.errorCode,
            requestedAt: r.requestedAt,
            completedAt: r.completedAt
        }))
    };
}
