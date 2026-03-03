import prisma from "@/lib/prisma"

const MAX_ATTEMPTS = 5

export async function processAccountingOutbox(batchSize = 20) {
    const now = new Date()

    const jobs = await prisma.accountingOutbox.findMany({
        where: {
            status: "PENDING",
            OR: [
                { nextRetryAt: null },
                { nextRetryAt: { lte: now } }
            ]
        },
        take: batchSize,
        orderBy: { createdAt: "asc" }
    })

    for (const job of jobs) {
        try {
            await prisma.accountingOutbox.update({
                where: { id: job.id },
                data: { status: "PROCESSING" }
            })

            // TODO: Sprint 4'te gerçek ledger çağrısı burada olacak
            console.info("[ACCOUNTING WORKER NOOP]", job.event, job.entityId)

            await prisma.accountingOutbox.update({
                where: { id: job.id },
                data: { status: "DONE" }
            })

        } catch (err: any) {
            const attempts = job.attempts + 1
            const retryDelayMs = 5000 * attempts

            await prisma.accountingOutbox.update({
                where: { id: job.id },
                data: {
                    status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
                    attempts,
                    nextRetryAt: new Date(Date.now() + retryDelayMs),
                    lastError: err?.message?.slice(0, 500)
                }
            })
        }
    }
}
