"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { shipmentSyncQueue } from "@/queues/shipmentQueue";
import { prisma } from "@/lib/prisma";

export async function syncShipmentAction(shipmentId: string) {
    const session: any = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
    });

    if (!shipment) {
        throw new Error("Shipment not found.");
    }

    if (shipment.status === 'DELIVERED') {
        throw new Error("Shipment is already DELIVERED.");
    }

    // Enqueue manual sync
    await shipmentSyncQueue.add('manual-sync', { shipmentId }, {
        attempts: 1, // Manual sync doesn't need to retry 5 times immediately
        jobId: `manual_sync_${shipmentId}_${Date.now()}`
    });

    revalidatePath('/admin/ops/shipments');
    return { success: true };
}
