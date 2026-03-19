import { prismaRaw as prisma } from "@/lib/prisma"

export async function enqueueAccountingEvent(params: {
    tenantId: string
    event: "ORDER_CREATED" | "PAYMENT_SUCCEEDED" | "REFUND_SUCCEEDED"
    entityId: string
}) {
    const dedupeKey = `${params.event}:${params.entityId}`

    try {
        await prisma.accountingOutbox.create({
            data: {
                tenantId: params.tenantId,
                event: params.event,
                entityId: params.entityId,
                dedupeKey,
            },
        })
    } catch (e: any) {
        // duplicate ise sessiz geç
        if (e.code === "P2002") return
        throw e
    }
}
